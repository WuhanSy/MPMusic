"""MusicDL 音乐插件：调用 musicdl HTTP 服务搜索下载音乐，落盘后交给 MoviePilot 整理刮削入库。"""

import threading
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from app.plugins import _PluginBase
from app.schemas.file import FileItem
from app.schemas.types import (
    MUSIC_ENTITY_ALBUM,
    MUSIC_ENTITY_RECORDING,
    MediaType,
    MessageType,
)
from app.sdk.logging import logger
from app.sdk.network import RequestUtils

# musicdl 容器默认地址（与 MoviePilot 处于同一 docker 网络时按容器名访问）
DEFAULT_SERVICE_URL = "http://musicdl:8080"
# 音乐落盘目录，必须是 MoviePilot 容器内 /media 挂载根下的路径，才能硬链接整理
DEFAULT_DOWNLOAD_DIR = "/media/musicdl"


class MusicDl(_PluginBase):
    """把 musicdl 的搜索/下载能力接入 MoviePilot，并在落盘后触发现有整理刮削链。"""

    plugin_name = "MusicDL音乐"
    plugin_desc = "调用 musicdl 服务搜索、下载音乐，落盘后交给 MoviePilot 整理与刮削入库"
    plugin_version = "1.0.0"
    plugin_author = "MusicdlDocker"
    author_url = "https://github.com/CharlesPikachu/musicdl"
    plugin_config_prefix = "musicdl_"
    plugin_order = 40
    auth_level = 1

    # 插件运行状态
    _enabled: bool = False
    # musicdl HTTP 服务地址
    _service_url: str = DEFAULT_SERVICE_URL
    # 歌曲落盘目录（MoviePilot 视角）
    _download_dir: str = DEFAULT_DOWNLOAD_DIR
    # 下载完成后是否自动触发整理
    _auto_transfer: bool = True
    # 整理时声明的音乐实体类型：recording / album
    _music_type: str = MUSIC_ENTITY_RECORDING
    # 任务完成后是否发送通知
    _notify: bool = True
    # 搜索超时（秒）
    _search_timeout: int = 30
    # 下载超时（秒）
    _download_timeout: int = 1800

    def init_plugin(self, config: Optional[Dict[str, Any]] = None) -> None:
        """
        生效插件配置

        :param config: 插件配置字典
        """
        config = config or {}
        self._enabled = bool(config.get("enabled", False))
        self._service_url = str(config.get("musicdl_url") or DEFAULT_SERVICE_URL).rstrip("/")
        self._download_dir = str(config.get("download_dir") or DEFAULT_DOWNLOAD_DIR).rstrip("/")
        self._auto_transfer = bool(config.get("auto_transfer", True))
        self._music_type = self._normalize_music_type(config.get("music_type"))
        self._notify = bool(config.get("notify", True))
        self._search_timeout = self._as_int(config.get("search_timeout"), 30)
        self._download_timeout = self._as_int(config.get("download_timeout"), 1800)

    def get_state(self) -> bool:
        """
        获取插件运行状态

        :return: 插件是否启用
        """
        return self._enabled

    @staticmethod
    def get_command() -> List[Dict[str, Any]]:
        """
        注册插件远程命令

        :return: 命令列表，本插件不注册远程命令
        """
        return []

    def get_api(self) -> List[Dict[str, Any]]:
        """
        注册插件 API

        :return: API 声明列表
        """
        return [
            {
                "path": "/health",
                "endpoint": self.api_health,
                "methods": ["GET"],
                "auth": "apikey",
                "summary": "musicdl 服务健康检查",
            },
            {
                "path": "/search",
                "endpoint": self.api_search,
                "methods": ["POST"],
                "auth": "apikey",
                "summary": "按关键词搜索歌曲",
            },
            {
                "path": "/download",
                "endpoint": self.api_download,
                "methods": ["POST"],
                "auth": "apikey",
                "summary": "下载歌曲并在落盘后触发整理",
            },
            {
                "path": "/transfer",
                "endpoint": self.api_transfer,
                "methods": ["POST"],
                "auth": "apikey",
                "summary": "对已落盘的音乐文件触发整理刮削",
            },
        ]

    def get_form(self) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        拼装插件配置页面

        :return: Vuetify 页面配置与默认配置字典
        """
        return [
            {
                "component": "VForm",
                "content": [
                    {
                        "component": "VRow",
                        "content": [
                            {
                                "component": "VCol",
                                "props": {"cols": 12, "md": 3},
                                "content": [
                                    {
                                        "component": "VSwitch",
                                        "props": {"model": "enabled", "label": "启用插件"},
                                    }
                                ],
                            },
                            {
                                "component": "VCol",
                                "props": {"cols": 12, "md": 9},
                                "content": [
                                    {
                                        "component": "VTextField",
                                        "props": {
                                            "model": "musicdl_url",
                                            "label": "musicdl 服务地址",
                                            "placeholder": DEFAULT_SERVICE_URL,
                                        },
                                    }
                                ],
                            },
                        ],
                    },
                    {
                        "component": "VRow",
                        "content": [
                            {
                                "component": "VCol",
                                "props": {"cols": 12, "md": 6},
                                "content": [
                                    {
                                        "component": "VTextField",
                                        "props": {
                                            "model": "download_dir",
                                            "label": "下载目录（MoviePilot 视角）",
                                            "placeholder": DEFAULT_DOWNLOAD_DIR,
                                        },
                                    }
                                ],
                            },
                            {
                                "component": "VCol",
                                "props": {"cols": 12, "md": 6},
                                "content": [
                                    {
                                        "component": "VSelect",
                                        "props": {
                                            "model": "music_type",
                                            "label": "整理时声明的音乐类型",
                                            "items": [
                                                {"title": "单曲（recording）", "value": MUSIC_ENTITY_RECORDING},
                                                {"title": "专辑（album）", "value": MUSIC_ENTITY_ALBUM},
                                            ],
                                        },
                                    }
                                ],
                            },
                        ],
                    },
                    {
                        "component": "VRow",
                        "content": [
                            {
                                "component": "VCol",
                                "props": {"cols": 12, "md": 3},
                                "content": [
                                    {
                                        "component": "VSwitch",
                                        "props": {"model": "auto_transfer", "label": "下载后自动整理"},
                                    }
                                ],
                            },
                            {
                                "component": "VCol",
                                "props": {"cols": 12, "md": 3},
                                "content": [
                                    {
                                        "component": "VSwitch",
                                        "props": {"model": "notify", "label": "完成后发送通知"},
                                    }
                                ],
                            },
                            {
                                "component": "VCol",
                                "props": {"cols": 12, "md": 3},
                                "content": [
                                    {
                                        "component": "VTextField",
                                        "props": {
                                            "model": "search_timeout",
                                            "label": "搜索超时（秒）",
                                            "type": "number",
                                        },
                                    }
                                ],
                            },
                            {
                                "component": "VCol",
                                "props": {"cols": 12, "md": 3},
                                "content": [
                                    {
                                        "component": "VTextField",
                                        "props": {
                                            "model": "download_timeout",
                                            "label": "下载超时（秒）",
                                            "type": "number",
                                        },
                                    }
                                ],
                            },
                        ],
                    },
                    {
                        "component": "VAlert",
                        "props": {
                            "type": "info",
                            "variant": "tonal",
                            "text": (
                                f"插件只负责调用 musicdl 下载并把文件交给 MoviePilot 整理链，"
                                f"歌词、封面与标签由 MoviePilot 的刮削流程写入。"
                                f"下载目录默认 {DEFAULT_DOWNLOAD_DIR}，必须与 MoviePilot 的 /media "
                                f"挂载指向同一宿主机目录，否则无法硬链接整理。"
                            ),
                        },
                    },
                ],
            }
        ], {
            "enabled": False,
            "musicdl_url": DEFAULT_SERVICE_URL,
            "download_dir": DEFAULT_DOWNLOAD_DIR,
            "auto_transfer": True,
            "music_type": MUSIC_ENTITY_RECORDING,
            "notify": True,
            "search_timeout": 30,
            "download_timeout": 1800,
        }

    def get_page(self) -> Optional[List[Dict[str, Any]]]:
        """
        拼装插件详情页

        :return: Vuetify 页面配置，展示服务地址与最近一次任务结果
        """
        last = self.get_data("last_result") or {}
        if last:
            summary = (
                f"最近一次任务：下载 {last.get('downloaded', 0)}/{last.get('total', 0)} 首，"
                f"整理 {last.get('transferred', 0)} 项，时间 {last.get('time', '-')}"
            )
            summary_type = "success" if last.get("success") else "warning"
        else:
            summary = "暂无任务记录"
            summary_type = "info"

        return [
            {
                "component": "VForm",
                "content": [
                    {
                        "component": "VAlert",
                        "props": {
                            "type": "info",
                            "variant": "tonal",
                            "text": (
                                f"musicdl 服务地址：{self._service_url}；"
                                f"下载目录：{self._download_dir}；"
                                f"自动整理：{'开启' if self._auto_transfer else '关闭'}"
                            ),
                        },
                    },
                    {
                        "component": "VAlert",
                        "props": {
                            "type": summary_type,
                            "variant": "tonal",
                            "text": summary,
                        },
                    },
                    {
                        "component": "VAlert",
                        "props": {
                            "type": "info",
                            "variant": "tonal",
                            "text": (
                                "调用方式（需 API Key）："
                                "POST /api/v1/plugin/MusicDl/search {\"keyword\": \"关键词\"}；"
                                "POST /api/v1/plugin/MusicDl/download {\"songs\": [搜索结果的子集]}；"
                                "POST /api/v1/plugin/MusicDl/transfer {\"paths\": [\"/media/musicdl/xxx.flac\"]}。"
                            ),
                        },
                    },
                ],
            }
        ]

    def stop_service(self) -> None:
        """
        停止插件服务
        """
        return None

    def api_health(self) -> Dict[str, Any]:
        """
        检查 musicdl 服务健康状态

        :return: 插件与 musicdl 服务的状态信息
        """
        response = self._request("get", "/health", self._search_timeout)
        success, payload = self._read_json(response)
        return {
            "success": bool(success),
            "plugin_enabled": self._enabled,
            "service_url": self._service_url,
            "download_dir": self._download_dir,
            "auto_transfer": self._auto_transfer,
            "music_type": self._music_type,
            "musicdl": payload if success else None,
            "message": None if success else str(payload),
        }

    def api_search(self, payload: Optional[Dict[str, Any]] = None, keyword: Optional[str] = None) -> Dict[str, Any]:
        """
        按关键词搜索歌曲

        :param payload: JSON 请求体，支持 keyword 字段
        :param keyword: 查询串形式的搜索关键词
        :return: 搜索结果
        """
        payload = payload or {}
        search_keyword = str(payload.get("keyword") or keyword or "").strip()
        if not search_keyword:
            return {"success": False, "message": "缺少参数 keyword"}

        response = self._request("post", "/search", self._search_timeout, json={"keyword": search_keyword})
        success, data = self._read_json(response)
        if not success:
            return {"success": False, "message": str(data)}
        if not isinstance(data, dict):
            return {"success": False, "message": "musicdl 返回格式异常"}
        return data

    def api_download(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        下载歌曲，并按配置在落盘后触发 MoviePilot 整理

        :param payload: JSON 请求体，songs 为 /search 返回的 results 子集；
                        可选 auto_transfer、music_type、background
        :return: 下载与整理结果，background 为真时立即返回受理结果
        """
        songs = payload.get("songs")
        if isinstance(songs, dict):
            songs = [song for group in songs.values() for song in (group or [])]
        if not isinstance(songs, list) or not songs:
            return {"success": False, "message": "缺少参数 songs（/search 返回的 results 子集）"}

        auto_transfer = payload.get("auto_transfer")
        if auto_transfer is None:
            auto_transfer = self._auto_transfer
        music_type = self._normalize_music_type(payload.get("music_type") or self._music_type)

        if payload.get("background"):
            threading.Thread(
                target=self._download_and_transfer,
                args=(songs, bool(auto_transfer), music_type),
                daemon=True,
            ).start()
            return {
                "success": True,
                "background": True,
                "message": f"已在后台受理 {len(songs)} 首歌曲的下载任务",
            }

        return self._download_and_transfer(songs, bool(auto_transfer), music_type)

    def api_transfer(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        对已落盘的音乐文件触发整理刮削

        :param payload: JSON 请求体，paths 为文件或目录路径列表；
                        缺省时整理下载目录下的全部条目，可选 music_type、preview
        :return: 整理结果
        """
        paths = payload.get("paths")
        if isinstance(paths, str):
            paths = [paths]
        if not paths:
            root = Path(self._download_dir)
            paths = sorted(item.as_posix() for item in root.iterdir()) if root.is_dir() else []
        if not paths:
            return {"success": False, "message": "缺少参数 paths，且下载目录为空"}

        music_type = self._normalize_music_type(payload.get("music_type") or self._music_type)
        results = self._manual_transfer(
            paths=paths,
            music_type=music_type,
            preview=bool(payload.get("preview", False)),
        )
        succeeded = [item for item in results if item.get("success")]
        return {
            "success": bool(succeeded),
            "total": len(results),
            "transferred": len(succeeded),
            "results": results,
            "message": None if succeeded else "整理未成功，请检查 MoviePilot 整理日志",
        }

    def _download_and_transfer(
        self,
        songs: List[Dict[str, Any]],
        auto_transfer: bool,
        music_type: str,
    ) -> Dict[str, Any]:
        """
        调用 musicdl 下载歌曲，并按需触发整理，最后记录并通知结果

        :param songs: /search 返回的歌曲字典列表
        :param auto_transfer: 是否在下载成功后触发整理
        :param music_type: 整理时声明的音乐实体类型
        :return: 下载与整理结果
        """
        response = self._request("post", "/download", self._download_timeout, json={"songs": songs})
        success, data = self._read_json(response)
        if not success or not isinstance(data, dict):
            result: Dict[str, Any] = {"success": False, "message": str(data), "total": len(songs)}
            self._record_result(result)
            self._send_notification("MusicDL 下载失败", str(data))
            return result

        result = dict(data)
        transfers: List[Dict[str, Any]] = []
        if result.get("success") and auto_transfer:
            paths = [
                item.get("save_path")
                for item in result.get("files") or []
                if isinstance(item, dict) and item.get("save_path")
            ]
            transfers = self._manual_transfer(paths=paths, music_type=music_type)
        result["transfers"] = transfers

        self._record_result(result)
        if result.get("success"):
            self._send_notification(
                "MusicDL 下载完成",
                f"下载 {result.get('downloaded', 0)}/{result.get('total', 0)} 首，"
                f"整理 {len([item for item in transfers if item.get('success')])} 项",
            )
        else:
            self._send_notification("MusicDL 下载失败", str(result.get("message") or result.get("error")))
        return result

    def _manual_transfer(
        self,
        paths: List[str],
        music_type: Optional[str] = None,
        preview: bool = False,
    ) -> List[Dict[str, Any]]:
        """
        把落盘文件逐个交给 MoviePilot 的整理链完成刮削入库

        :param paths: 文件或目录路径列表
        :param music_type: 音乐实体类型，recording 表示单曲，album 表示专辑目录
        :param preview: 是否只预览整理结果而不实际移动文件
        :return: 每项包含路径、是否成功与说明的结果列表
        """
        # 延迟导入，避免插件加载期形成对整理链的反向依赖
        from app.chain.transfer import TransferChain

        entity = self._normalize_music_type(music_type or self._music_type)
        chain = TransferChain()
        results: List[Dict[str, Any]] = []
        for raw_path in paths:
            media_path = Path(str(raw_path))
            if not media_path.exists():
                results.append({"path": str(raw_path), "success": False, "message": "路径不存在"})
                continue
            fileitem = FileItem(
                path=media_path.as_posix(),
                storage="local",
                type="dir" if media_path.is_dir() else "file",
                name=media_path.name,
                basename=media_path.stem,
                extension=media_path.suffix,
            )
            try:
                success, message = chain.manual_transfer(
                    fileitem=fileitem,
                    mtype=MediaType.MUSIC,
                    music_type=entity,
                    force=False,
                    preview=preview,
                    report_results=True,
                )
            except Exception as err:  # noqa: BLE001
                logger.error(f"MusicDL 触发整理失败：{media_path.as_posix()} - {str(err)}")
                results.append({"path": media_path.as_posix(), "success": False, "message": str(err)})
                continue
            results.append({
                "path": media_path.as_posix(),
                "success": bool(success),
                "message": message if isinstance(message, str) else str(message),
            })
        return results

    def _request(self, method: str, path: str, timeout: int, **kwargs: Any):
        """
        调用 musicdl 服务的 HTTP 接口

        :param method: 请求方法，get 或 post
        :param path: 接口路径，如 /health
        :param timeout: 超时秒数
        :param kwargs: 其他请求参数，如 json
        :return: HTTP 响应对象，异常时返回 None
        """
        url = f"{self._service_url}{path}"
        request_utils = RequestUtils(timeout=timeout)
        if method == "get":
            return request_utils.get_res(url=url, **kwargs)
        return request_utils.post_res(url=url, **kwargs)

    @staticmethod
    def _read_json(response) -> Tuple[bool, Any]:
        """
        读取响应 JSON

        :param response: HTTP 响应对象
        :return: 是否成功与解析结果或错误说明
        """
        if response is None:
            return False, "请求 musicdl 服务失败（连接异常或超时）"
        try:
            return True, response.json()
        except Exception:  # noqa: BLE001
            return False, f"musicdl 响应解析失败：HTTP {getattr(response, 'status_code', '未知')}"

    @staticmethod
    def _normalize_music_type(value: Any) -> str:
        """
        归一化音乐实体类型

        :param value: 原始取值
        :return: recording 或 album
        """
        return MUSIC_ENTITY_ALBUM if str(value or "").strip().lower() == MUSIC_ENTITY_ALBUM else MUSIC_ENTITY_RECORDING

    @staticmethod
    def _as_int(value: Any, default: int) -> int:
        """
        把配置值安全转换为整数

        :param value: 原始取值
        :param default: 转换失败时的默认值
        :return: 整数结果
        """
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    def _record_result(self, result: Dict[str, Any]) -> None:
        """
        记录最近一次任务结果，供详情页展示

        :param result: 任务结果字典
        """
        summary = {
            "success": bool(result.get("success")),
            "total": result.get("total", 0),
            "downloaded": result.get("downloaded", 0),
            "transferred": len([item for item in result.get("transfers") or [] if item.get("success")]),
            "message": result.get("message"),
            "time": self._now(),
        }
        try:
            self.save_data("last_result", summary)
        except Exception as err:  # noqa: BLE001
            logger.error(f"MusicDL 记录任务结果失败：{str(err)}")

    @staticmethod
    def _now() -> str:
        """
        获取当前时间字符串

        :return: 形如 2026-09-24 10:00:00 的时间字符串
        """
        from datetime import datetime

        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    def _send_notification(self, title: str, text: str) -> None:
        """
        发送插件通知，失败不影响主流程

        :param title: 通知标题
        :param text: 通知正文
        """
        if not self._notify:
            return
        try:
            self.post_message(mtype=MessageType.Plugin, title=title, text=text)
        except Exception as err:  # noqa: BLE001
            logger.error(f"MusicDL 发送通知失败：{str(err)}")
