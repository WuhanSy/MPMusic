import { importShared } from './__federation_fn_import-JrT3xvdd.js';

const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};

const {createTextVNode:_createTextVNode,resolveComponent:_resolveComponent,withCtx:_withCtx,createVNode:_createVNode,toDisplayString:_toDisplayString,openBlock:_openBlock,createBlock:_createBlock,createCommentVNode:_createCommentVNode,withKeys:_withKeys,createElementBlock:_createElementBlock,renderList:_renderList,Fragment:_Fragment,createElementVNode:_createElementVNode} = await importShared('vue');


const _hoisted_1 = { class: "musicdl-page" };
const _hoisted_2 = {
  key: 1,
  class: "d-flex align-center flex-wrap ga-2 mt-4"
};
const _hoisted_3 = {
  key: 3,
  class: "text-medium-emphasis mt-6 text-center"
};
const _hoisted_4 = { class: "font-weight-medium" };
const _hoisted_5 = { class: "d-flex align-center mb-2" };
const _hoisted_6 = { class: "text-caption text-medium-emphasis text-right" };

const {computed,inject,ref} = await importShared('vue');



const _sfc_main = {
  __name: 'Page',
  props: {
  api: { type: Object, default: () => ({}) },
  pluginId: { type: String, default: 'MusicDl' },
  sourcePluginId: { type: String, default: '' },
  nativeSubscribe: { type: Function, default: null },
},
  emits: ['action', 'switch', 'close'],
  setup(__props, { emit: __emit }) {

const props = __props;

const emit = __emit;
const toast = inject('moviepilot:toast', null);

const keyword = ref('');
const loading = ref(false);
const downloading = ref(false);
const error = ref('');
const searched = ref(false);
// musicdl /search 返回结构：{ 音源名: [SongInfo, ...] }
const grouped = ref({});
const selectedKeys = ref([]);
const background = ref(true);

const sources = computed(() => Object.keys(grouped.value));
const totalCount = computed(() =>
  sources.value.reduce((sum, source) => sum + songList(source).length, 0),
);
const selectedCount = computed(() => selectedKeys.value.length);

function songList(source) {
  const list = grouped.value[source];
  return Array.isArray(list) ? list : []
}

function unwrap(response) {
  // 宿主 envelope 形如 { success, message, data }；插件自定义结构则原样返回
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    const keys = Object.keys(response);
    const isEnvelope =
      keys.length === 3 && keys.every((key) => ['success', 'message', 'data'].includes(key));
    if (isEnvelope) {
      return response.success === false ? response : response.data ?? response
    }
  }
  return response
}

function songName(song) {
  return song?.song_name || song?.name || '未知歌曲'
}

function singersText(song) {
  const singers = song?.singers;
  if (Array.isArray(singers)) {
    return singers.filter(Boolean).join(' / ') || '未知歌手'
  }
  return singers || '未知歌手'
}

function durationText(song) {
  if (song?.duration) return song.duration
  const seconds = Number(song?.duration_s);
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

function sizeText(song) {
  return song?.file_size || ''
}

function sourceKeys(source) {
  return songList(source).map((_, index) => `${source}#${index}`)
}

function isAllSelected(source) {
  const keys = sourceKeys(source);
  return keys.length > 0 && keys.every((key) => selectedKeys.value.includes(key))
}

function isPartiallySelected(source) {
  const keys = sourceKeys(source);
  const picked = keys.filter((key) => selectedKeys.value.includes(key)).length;
  return picked > 0 && picked < keys.length
}

function toggleSource(source, value) {
  const keys = sourceKeys(source);
  const next = new Set(selectedKeys.value);
  keys.forEach((key) => (value ? next.add(key) : next.delete(key)));
  selectedKeys.value = [...next];
}

function reset() {
  keyword.value = '';
  grouped.value = {};
  selectedKeys.value = [];
  searched.value = false;
  error.value = '';
}

async function search() {
  const kw = keyword.value?.trim();
  if (!kw) {
    toast?.warning('请输入搜索关键词');
    return
  }
  loading.value = true;
  error.value = '';
  selectedKeys.value = [];
  try {
    const data = unwrap(await props.api.post(`plugin/${props.pluginId}/search`, { keyword: kw }));
    if (data && typeof data === 'object' && data.success === false) {
      grouped.value = {};
      error.value = data.message || '搜索失败';
    } else if (data && typeof data === 'object' && !Array.isArray(data)) {
      grouped.value = data;
    } else {
      grouped.value = {};
      error.value = '搜索返回格式异常';
    }
  } catch (err) {
    grouped.value = {};
    error.value = err?.message || '搜索请求失败';
  } finally {
    searched.value = true;
    loading.value = false;
  }
}

async function downloadSelected() {
  const songs = [];
  sources.value.forEach((source) => {
    songList(source).forEach((song, index) => {
      if (selectedKeys.value.includes(`${source}#${index}`)) {
        songs.push(song);
      }
    });
  });
  if (!songs.length) {
    toast?.warning('请先选择要下载的歌曲');
    return
  }
  downloading.value = true;
  error.value = '';
  try {
    const result = unwrap(
      await props.api.post(`plugin/${props.pluginId}/download`, {
        songs,
        background: background.value,
      }),
    );
    if (result && result.success === false) {
      error.value = result.message || '下载失败';
      toast?.error(error.value);
      return
    }
    toast?.success(result?.message || `已提交 ${songs.length} 首歌曲的下载任务`);
    selectedKeys.value = [];
    emit('action');
  } catch (err) {
    error.value = err?.message || '下载请求失败';
    toast?.error(error.value);
  } finally {
    downloading.value = false;
  }
}

return (_ctx, _cache) => {
  const _component_v_icon = _resolveComponent("v-icon");
  const _component_v_card_title = _resolveComponent("v-card-title");
  const _component_v_btn = _resolveComponent("v-btn");
  const _component_v_card_item = _resolveComponent("v-card-item");
  const _component_v_alert = _resolveComponent("v-alert");
  const _component_v_text_field = _resolveComponent("v-text-field");
  const _component_v_col = _resolveComponent("v-col");
  const _component_v_row = _resolveComponent("v-row");
  const _component_v_chip = _resolveComponent("v-chip");
  const _component_v_switch = _resolveComponent("v-switch");
  const _component_v_spacer = _resolveComponent("v-spacer");
  const _component_v_skeleton_loader = _resolveComponent("v-skeleton-loader");
  const _component_v_expansion_panel_title = _resolveComponent("v-expansion-panel-title");
  const _component_v_checkbox_btn = _resolveComponent("v-checkbox-btn");
  const _component_v_list_item_title = _resolveComponent("v-list-item-title");
  const _component_v_list_item_subtitle = _resolveComponent("v-list-item-subtitle");
  const _component_v_list_item = _resolveComponent("v-list-item");
  const _component_v_list = _resolveComponent("v-list");
  const _component_v_expansion_panel_text = _resolveComponent("v-expansion-panel-text");
  const _component_v_expansion_panel = _resolveComponent("v-expansion-panel");
  const _component_v_expansion_panels = _resolveComponent("v-expansion-panels");
  const _component_v_card_text = _resolveComponent("v-card-text");
  const _component_v_divider = _resolveComponent("v-divider");
  const _component_v_card_actions = _resolveComponent("v-card-actions");
  const _component_v_card = _resolveComponent("v-card");

  return (_openBlock(), _createElementBlock("div", _hoisted_1, [
    _createVNode(_component_v_card, { variant: "flat" }, {
      default: _withCtx(() => [
        _createVNode(_component_v_card_item, null, {
          append: _withCtx(() => [
            _createVNode(_component_v_btn, {
              icon: "",
              variant: "text",
              onClick: _cache[0] || (_cache[0] = $event => (emit('close')))
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_icon, null, {
                  default: _withCtx(() => [...(_cache[8] || (_cache[8] = [
                    _createTextVNode("mdi-close", -1)
                  ]))]),
                  _: 1
                })
              ]),
              _: 1
            })
          ]),
          default: _withCtx(() => [
            _createVNode(_component_v_card_title, { class: "d-flex align-center" }, {
              default: _withCtx(() => [
                _createVNode(_component_v_icon, { class: "mr-2" }, {
                  default: _withCtx(() => [...(_cache[6] || (_cache[6] = [
                    _createTextVNode("mdi-music-search", -1)
                  ]))]),
                  _: 1
                }),
                _cache[7] || (_cache[7] = _createTextVNode(" MusicDL 歌曲搜索 ", -1))
              ]),
              _: 1
            })
          ]),
          _: 1
        }),
        _createVNode(_component_v_card_text, null, {
          default: _withCtx(() => [
            (error.value)
              ? (_openBlock(), _createBlock(_component_v_alert, {
                  key: 0,
                  type: "error",
                  variant: "tonal",
                  class: "mb-4",
                  closable: "",
                  "onClick:close": _cache[1] || (_cache[1] = $event => (error.value = ''))
                }, {
                  default: _withCtx(() => [
                    _createTextVNode(_toDisplayString(error.value), 1)
                  ]),
                  _: 1
                }))
              : _createCommentVNode("", true),
            _createVNode(_component_v_row, {
              dense: "",
              align: "center"
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_col, {
                  cols: "12",
                  md: "9"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_text_field, {
                      modelValue: keyword.value,
                      "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((keyword).value = $event)),
                      label: "搜索歌曲",
                      placeholder: "输入歌名 / 歌手 / 专辑关键词",
                      variant: "outlined",
                      density: "comfortable",
                      "hide-details": "",
                      clearable: "",
                      "prepend-inner-icon": "mdi-magnify",
                      loading: loading.value,
                      onKeyup: _withKeys(search, ["enter"])
                    }, {
                      append: _withCtx(() => [
                        _createVNode(_component_v_btn, {
                          color: "primary",
                          loading: loading.value,
                          onClick: search
                        }, {
                          default: _withCtx(() => [
                            _createVNode(_component_v_icon, { start: "" }, {
                              default: _withCtx(() => [...(_cache[9] || (_cache[9] = [
                                _createTextVNode("mdi-magnify", -1)
                              ]))]),
                              _: 1
                            }),
                            _cache[10] || (_cache[10] = _createTextVNode(" 搜索 ", -1))
                          ]),
                          _: 1
                        }, 8, ["loading"])
                      ]),
                      _: 1
                    }, 8, ["modelValue", "loading"])
                  ]),
                  _: 1
                }),
                _createVNode(_component_v_col, {
                  cols: "12",
                  md: "3"
                }, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_btn, {
                      variant: "text",
                      block: "",
                      disabled: loading.value,
                      onClick: reset
                    }, {
                      default: _withCtx(() => [...(_cache[11] || (_cache[11] = [
                        _createTextVNode("清空", -1)
                      ]))]),
                      _: 1
                    }, 8, ["disabled"])
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }),
            (searched.value)
              ? (_openBlock(), _createElementBlock("div", _hoisted_2, [
                  _createVNode(_component_v_chip, {
                    size: "small",
                    color: "primary",
                    variant: "tonal"
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode(_toDisplayString(totalCount.value) + " 首结果", 1)
                    ]),
                    _: 1
                  }),
                  _createVNode(_component_v_chip, {
                    size: "small",
                    variant: "tonal"
                  }, {
                    default: _withCtx(() => [
                      _createTextVNode(_toDisplayString(sources.value.length) + " 个音源", 1)
                    ]),
                    _: 1
                  }),
                  _createVNode(_component_v_switch, {
                    modelValue: background.value,
                    "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((background).value = $event)),
                    color: "primary",
                    density: "compact",
                    "hide-details": "",
                    label: "后台下载",
                    class: "ml-2"
                  }, null, 8, ["modelValue"]),
                  _createVNode(_component_v_spacer),
                  _createVNode(_component_v_btn, {
                    color: "primary",
                    disabled: !selectedCount.value,
                    loading: downloading.value,
                    onClick: downloadSelected
                  }, {
                    default: _withCtx(() => [
                      _createVNode(_component_v_icon, { start: "" }, {
                        default: _withCtx(() => [...(_cache[12] || (_cache[12] = [
                          _createTextVNode("mdi-download", -1)
                        ]))]),
                        _: 1
                      }),
                      _createTextVNode(" 下载所选（" + _toDisplayString(selectedCount.value) + "） ", 1)
                    ]),
                    _: 1
                  }, 8, ["disabled", "loading"])
                ]))
              : _createCommentVNode("", true),
            (loading.value)
              ? (_openBlock(), _createBlock(_component_v_skeleton_loader, {
                  key: 2,
                  type: "list-item-two-line@4",
                  class: "mt-4"
                }))
              : (searched.value && !totalCount.value)
                ? (_openBlock(), _createElementBlock("div", _hoisted_3, " 没有搜索到歌曲，换个关键词试试 "))
                : (totalCount.value)
                  ? (_openBlock(), _createBlock(_component_v_expansion_panels, {
                      key: 4,
                      class: "mt-4",
                      variant: "accordion",
                      multiple: ""
                    }, {
                      default: _withCtx(() => [
                        (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(sources.value, (source) => {
                          return (_openBlock(), _createBlock(_component_v_expansion_panel, { key: source }, {
                            default: _withCtx(() => [
                              _createVNode(_component_v_expansion_panel_title, null, {
                                default: _withCtx(() => [
                                  _createVNode(_component_v_icon, {
                                    start: "",
                                    size: "small"
                                  }, {
                                    default: _withCtx(() => [...(_cache[13] || (_cache[13] = [
                                      _createTextVNode("mdi-music-box-multiple", -1)
                                    ]))]),
                                    _: 1
                                  }),
                                  _createElementVNode("span", _hoisted_4, _toDisplayString(source), 1),
                                  _createVNode(_component_v_chip, {
                                    size: "x-small",
                                    variant: "tonal",
                                    class: "ml-2"
                                  }, {
                                    default: _withCtx(() => [
                                      _createTextVNode(_toDisplayString(songList(source).length), 1)
                                    ]),
                                    _: 2
                                  }, 1024)
                                ]),
                                _: 2
                              }, 1024),
                              _createVNode(_component_v_expansion_panel_text, null, {
                                default: _withCtx(() => [
                                  _createElementVNode("div", _hoisted_5, [
                                    _createVNode(_component_v_checkbox_btn, {
                                      "model-value": isAllSelected(source),
                                      indeterminate: isPartiallySelected(source),
                                      density: "compact",
                                      "hide-details": "",
                                      "onUpdate:modelValue": (value) => toggleSource(source, value)
                                    }, null, 8, ["model-value", "indeterminate", "onUpdate:modelValue"]),
                                    _cache[14] || (_cache[14] = _createElementVNode("span", { class: "text-caption text-medium-emphasis" }, "全选本音源", -1))
                                  ]),
                                  _createVNode(_component_v_list, {
                                    density: "compact",
                                    class: "pa-0"
                                  }, {
                                    default: _withCtx(() => [
                                      (_openBlock(true), _createElementBlock(_Fragment, null, _renderList(songList(source), (song, index) => {
                                        return (_openBlock(), _createBlock(_component_v_list_item, {
                                          key: index,
                                          value: index
                                        }, {
                                          prepend: _withCtx(() => [
                                            _createVNode(_component_v_checkbox_btn, {
                                              modelValue: selectedKeys.value,
                                              "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((selectedKeys).value = $event)),
                                              value: `${source}#${index}`,
                                              density: "compact"
                                            }, null, 8, ["modelValue", "value"])
                                          ]),
                                          append: _withCtx(() => [
                                            _createElementVNode("div", _hoisted_6, [
                                              _createElementVNode("div", null, _toDisplayString(durationText(song)), 1),
                                              _createElementVNode("div", null, _toDisplayString(sizeText(song)), 1)
                                            ])
                                          ]),
                                          default: _withCtx(() => [
                                            _createVNode(_component_v_list_item_title, null, {
                                              default: _withCtx(() => [
                                                _createTextVNode(_toDisplayString(songName(song)), 1)
                                              ]),
                                              _: 2
                                            }, 1024),
                                            _createVNode(_component_v_list_item_subtitle, null, {
                                              default: _withCtx(() => [
                                                _createTextVNode(_toDisplayString(singersText(song)) + " ", 1),
                                                (song.album)
                                                  ? (_openBlock(), _createElementBlock(_Fragment, { key: 0 }, [
                                                      _createTextVNode(" · " + _toDisplayString(song.album), 1)
                                                    ], 64))
                                                  : _createCommentVNode("", true)
                                              ]),
                                              _: 2
                                            }, 1024)
                                          ]),
                                          _: 2
                                        }, 1032, ["value"]))
                                      }), 128))
                                    ]),
                                    _: 2
                                  }, 1024)
                                ]),
                                _: 2
                              }, 1024)
                            ]),
                            _: 2
                          }, 1024))
                        }), 128))
                      ]),
                      _: 1
                    }))
                  : _createCommentVNode("", true)
          ]),
          _: 1
        }),
        _createVNode(_component_v_divider),
        _createVNode(_component_v_card_actions, null, {
          default: _withCtx(() => [
            _cache[17] || (_cache[17] = _createElementVNode("span", { class: "text-caption text-medium-emphasis pl-2" }, " 歌词、封面与标签由 MoviePilot 刮削流程写入 ", -1)),
            _createVNode(_component_v_spacer),
            _createVNode(_component_v_btn, {
              variant: "text",
              onClick: _cache[5] || (_cache[5] = $event => (emit('switch')))
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_icon, { start: "" }, {
                  default: _withCtx(() => [...(_cache[15] || (_cache[15] = [
                    _createTextVNode("mdi-cog", -1)
                  ]))]),
                  _: 1
                }),
                _cache[16] || (_cache[16] = _createTextVNode(" 配置 ", -1))
              ]),
              _: 1
            })
          ]),
          _: 1
        })
      ]),
      _: 1
    })
  ]))
}
}

};
const Page = /*#__PURE__*/_export_sfc(_sfc_main, [['__scopeId',"data-v-3308ddc0"]]);

export { Page as default };
