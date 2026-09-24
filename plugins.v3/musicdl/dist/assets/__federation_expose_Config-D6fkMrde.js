import { importShared } from './__federation_fn_import-JrT3xvdd.js';

const {createTextVNode:_createTextVNode,resolveComponent:_resolveComponent,withCtx:_withCtx,createVNode:_createVNode,toDisplayString:_toDisplayString,openBlock:_openBlock,createBlock:_createBlock,createCommentVNode:_createCommentVNode,withModifiers:_withModifiers,createElementBlock:_createElementBlock} = await importShared('vue');


const _hoisted_1 = { class: "musicdl-config" };

const {reactive,ref,watch} = await importShared('vue');



const _sfc_main = {
  __name: 'Config',
  props: {
  initialConfig: { type: Object, default: () => ({}) },
  api: { type: Object, default: () => ({}) },
  pluginId: { type: String, default: 'MusicDl' },
  sourcePluginId: { type: String, default: '' },
  nativeSubscribe: { type: Function, default: null },
},
  emits: ['save', 'close', 'switch'],
  setup(__props, { emit: __emit }) {

const props = __props;

const emit = __emit;

const valid = ref(true);
const error = ref('');

const DEFAULT_CONFIG = {
  enabled: false,
  musicdl_url: 'http://musicdl:8080',
  download_dir: '/media/musicdl',
  auto_transfer: true,
  music_type: 'recording',
  notify: true,
  search_timeout: 30,
  download_timeout: 1800,
};

const musicTypeOptions = [
  { title: '单曲（recording）', value: 'recording' },
  { title: '专辑（album）', value: 'album' },
];

const config = reactive({ ...DEFAULT_CONFIG });

function applyInitial(value) {
  Object.keys(DEFAULT_CONFIG).forEach((key) => {
    if (value && value[key] !== undefined && value[key] !== null) {
      config[key] = value[key];
    } else {
      config[key] = DEFAULT_CONFIG[key];
    }
  });
}

applyInitial(props.initialConfig);

watch(
  () => props.initialConfig,
  (value) => applyInitial(value),
);

function resetConfig() {
  applyInitial(null);
  error.value = '';
}

function saveConfig() {
  if (!valid.value) {
    error.value = '请先修正表单错误';
    return
  }
  error.value = '';
  emit('save', { ...config });
}

return (_ctx, _cache) => {
  const _component_v_icon = _resolveComponent("v-icon");
  const _component_v_card_title = _resolveComponent("v-card-title");
  const _component_v_btn = _resolveComponent("v-btn");
  const _component_v_card_item = _resolveComponent("v-card-item");
  const _component_v_alert = _resolveComponent("v-alert");
  const _component_v_switch = _resolveComponent("v-switch");
  const _component_v_col = _resolveComponent("v-col");
  const _component_v_text_field = _resolveComponent("v-text-field");
  const _component_v_select = _resolveComponent("v-select");
  const _component_v_row = _resolveComponent("v-row");
  const _component_v_form = _resolveComponent("v-form");
  const _component_v_card_text = _resolveComponent("v-card-text");
  const _component_v_spacer = _resolveComponent("v-spacer");
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
                  default: _withCtx(() => [...(_cache[14] || (_cache[14] = [
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
                  default: _withCtx(() => [...(_cache[12] || (_cache[12] = [
                    _createTextVNode("mdi-cog", -1)
                  ]))]),
                  _: 1
                }),
                _cache[13] || (_cache[13] = _createTextVNode(" MusicDL 插件配置 ", -1))
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
            _createVNode(_component_v_form, {
              modelValue: valid.value,
              "onUpdate:modelValue": _cache[10] || (_cache[10] = $event => ((valid).value = $event)),
              onSubmit: _withModifiers(saveConfig, ["prevent"])
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_row, null, {
                  default: _withCtx(() => [
                    _createVNode(_component_v_col, {
                      cols: "12",
                      md: "3"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_switch, {
                          modelValue: config.enabled,
                          "onUpdate:modelValue": _cache[2] || (_cache[2] = $event => ((config.enabled) = $event)),
                          color: "primary",
                          label: "启用插件",
                          "hide-details": ""
                        }, null, 8, ["modelValue"])
                      ]),
                      _: 1
                    }),
                    _createVNode(_component_v_col, {
                      cols: "12",
                      md: "9"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_text_field, {
                          modelValue: config.musicdl_url,
                          "onUpdate:modelValue": _cache[3] || (_cache[3] = $event => ((config.musicdl_url) = $event)),
                          label: "musicdl 服务地址",
                          variant: "outlined",
                          density: "comfortable",
                          placeholder: "http://musicdl:8080"
                        }, null, 8, ["modelValue"])
                      ]),
                      _: 1
                    }),
                    _createVNode(_component_v_col, {
                      cols: "12",
                      md: "6"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_text_field, {
                          modelValue: config.download_dir,
                          "onUpdate:modelValue": _cache[4] || (_cache[4] = $event => ((config.download_dir) = $event)),
                          label: "下载目录（MoviePilot 视角）",
                          variant: "outlined",
                          density: "comfortable",
                          placeholder: "/media/musicdl"
                        }, null, 8, ["modelValue"])
                      ]),
                      _: 1
                    }),
                    _createVNode(_component_v_col, {
                      cols: "12",
                      md: "6"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_select, {
                          modelValue: config.music_type,
                          "onUpdate:modelValue": _cache[5] || (_cache[5] = $event => ((config.music_type) = $event)),
                          label: "整理时声明的音乐类型",
                          variant: "outlined",
                          density: "comfortable",
                          items: musicTypeOptions,
                          "item-title": "title",
                          "item-value": "value"
                        }, null, 8, ["modelValue"])
                      ]),
                      _: 1
                    }),
                    _createVNode(_component_v_col, {
                      cols: "12",
                      md: "3"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_switch, {
                          modelValue: config.auto_transfer,
                          "onUpdate:modelValue": _cache[6] || (_cache[6] = $event => ((config.auto_transfer) = $event)),
                          color: "primary",
                          label: "下载后自动整理",
                          "hide-details": ""
                        }, null, 8, ["modelValue"])
                      ]),
                      _: 1
                    }),
                    _createVNode(_component_v_col, {
                      cols: "12",
                      md: "3"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_switch, {
                          modelValue: config.notify,
                          "onUpdate:modelValue": _cache[7] || (_cache[7] = $event => ((config.notify) = $event)),
                          color: "primary",
                          label: "完成后发送通知",
                          "hide-details": ""
                        }, null, 8, ["modelValue"])
                      ]),
                      _: 1
                    }),
                    _createVNode(_component_v_col, {
                      cols: "12",
                      md: "3"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_text_field, {
                          modelValue: config.search_timeout,
                          "onUpdate:modelValue": _cache[8] || (_cache[8] = $event => ((config.search_timeout) = $event)),
                          modelModifiers: { number: true },
                          label: "搜索超时（秒）",
                          type: "number",
                          min: "1",
                          variant: "outlined",
                          density: "comfortable"
                        }, null, 8, ["modelValue"])
                      ]),
                      _: 1
                    }),
                    _createVNode(_component_v_col, {
                      cols: "12",
                      md: "3"
                    }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_text_field, {
                          modelValue: config.download_timeout,
                          "onUpdate:modelValue": _cache[9] || (_cache[9] = $event => ((config.download_timeout) = $event)),
                          modelModifiers: { number: true },
                          label: "下载超时（秒）",
                          type: "number",
                          min: "1",
                          variant: "outlined",
                          density: "comfortable"
                        }, null, 8, ["modelValue"])
                      ]),
                      _: 1
                    }),
                    _createVNode(_component_v_col, { cols: "12" }, {
                      default: _withCtx(() => [
                        _createVNode(_component_v_alert, {
                          type: "info",
                          variant: "tonal"
                        }, {
                          default: _withCtx(() => [...(_cache[15] || (_cache[15] = [
                            _createTextVNode(" 插件只负责调用 musicdl 下载并把文件交给 MoviePilot 整理链，歌词、封面与标签由 MoviePilot 的刮削流程写入。下载目录必须与 MoviePilot 的 /media 挂载指向同一宿主机目录， 否则无法硬链接整理。 ", -1)
                          ]))]),
                          _: 1
                        })
                      ]),
                      _: 1
                    })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["modelValue"])
          ]),
          _: 1
        }),
        _createVNode(_component_v_card_actions, null, {
          default: _withCtx(() => [
            _createVNode(_component_v_btn, {
              variant: "text",
              onClick: resetConfig
            }, {
              default: _withCtx(() => [...(_cache[16] || (_cache[16] = [
                _createTextVNode("重置", -1)
              ]))]),
              _: 1
            }),
            _createVNode(_component_v_spacer),
            _createVNode(_component_v_btn, {
              variant: "text",
              onClick: _cache[11] || (_cache[11] = $event => (emit('switch')))
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_icon, { start: "" }, {
                  default: _withCtx(() => [...(_cache[17] || (_cache[17] = [
                    _createTextVNode("mdi-information-outline", -1)
                  ]))]),
                  _: 1
                }),
                _cache[18] || (_cache[18] = _createTextVNode(" 详情 ", -1))
              ]),
              _: 1
            }),
            _createVNode(_component_v_btn, {
              color: "primary",
              disabled: !valid.value,
              onClick: saveConfig
            }, {
              default: _withCtx(() => [
                _createVNode(_component_v_icon, { start: "" }, {
                  default: _withCtx(() => [...(_cache[19] || (_cache[19] = [
                    _createTextVNode("mdi-content-save", -1)
                  ]))]),
                  _: 1
                }),
                _cache[20] || (_cache[20] = _createTextVNode(" 保存配置 ", -1))
              ]),
              _: 1
            }, 8, ["disabled"])
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

export { _sfc_main as default };
