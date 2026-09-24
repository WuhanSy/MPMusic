<template>
  <div class="musicdl-config">
    <v-card variant="flat">
      <v-card-item>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-cog</v-icon>
          MusicDL 插件配置
        </v-card-title>
        <template #append>
          <v-btn icon variant="text" @click="emit('close')">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </template>
      </v-card-item>

      <v-card-text>
        <v-alert v-if="error" type="error" variant="tonal" class="mb-4" closable @click:close="error = ''">
          {{ error }}
        </v-alert>

        <v-form v-model="valid" @submit.prevent="saveConfig">
          <v-row>
            <v-col cols="12" md="3">
              <v-switch v-model="config.enabled" color="primary" label="启用插件" hide-details />
            </v-col>
            <v-col cols="12" md="9">
              <v-text-field
                v-model="config.musicdl_url"
                label="musicdl 服务地址"
                variant="outlined"
                density="comfortable"
                placeholder="http://musicdl:8080"
              />
            </v-col>

            <v-col cols="12" md="6">
              <v-text-field
                v-model="config.download_dir"
                label="下载目录（MoviePilot 视角）"
                variant="outlined"
                density="comfortable"
                placeholder="/media/musicdl"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="config.music_type"
                label="整理时声明的音乐类型"
                variant="outlined"
                density="comfortable"
                :items="musicTypeOptions"
                item-title="title"
                item-value="value"
              />
            </v-col>

            <v-col cols="12" md="3">
              <v-switch v-model="config.auto_transfer" color="primary" label="下载后自动整理" hide-details />
            </v-col>
            <v-col cols="12" md="3">
              <v-switch v-model="config.notify" color="primary" label="完成后发送通知" hide-details />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model.number="config.search_timeout"
                label="搜索超时（秒）"
                type="number"
                min="1"
                variant="outlined"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" md="3">
              <v-text-field
                v-model.number="config.download_timeout"
                label="下载超时（秒）"
                type="number"
                min="1"
                variant="outlined"
                density="comfortable"
              />
            </v-col>

            <v-col cols="12">
              <v-alert type="info" variant="tonal">
                插件只负责调用 musicdl 下载并把文件交给 MoviePilot 整理链，歌词、封面与标签由
                MoviePilot 的刮削流程写入。下载目录必须与 MoviePilot 的 /media 挂载指向同一宿主机目录，
                否则无法硬链接整理。
              </v-alert>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-btn variant="text" @click="resetConfig">重置</v-btn>
        <v-spacer />
        <v-btn variant="text" @click="emit('switch')">
          <v-icon start>mdi-information-outline</v-icon>
          详情
        </v-btn>
        <v-btn color="primary" :disabled="!valid" @click="saveConfig">
          <v-icon start>mdi-content-save</v-icon>
          保存配置
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'

const props = defineProps({
  initialConfig: { type: Object, default: () => ({}) },
  api: { type: Object, default: () => ({}) },
  pluginId: { type: String, default: 'MusicDl' },
  sourcePluginId: { type: String, default: '' },
  nativeSubscribe: { type: Function, default: null },
})

const emit = defineEmits(['save', 'close', 'switch'])

const valid = ref(true)
const error = ref('')

const DEFAULT_CONFIG = {
  enabled: false,
  musicdl_url: 'http://musicdl:8080',
  download_dir: '/media/musicdl',
  auto_transfer: true,
  music_type: 'recording',
  notify: true,
  search_timeout: 30,
  download_timeout: 1800,
}

const musicTypeOptions = [
  { title: '单曲（recording）', value: 'recording' },
  { title: '专辑（album）', value: 'album' },
]

const config = reactive({ ...DEFAULT_CONFIG })

function applyInitial(value) {
  Object.keys(DEFAULT_CONFIG).forEach((key) => {
    if (value && value[key] !== undefined && value[key] !== null) {
      config[key] = value[key]
    } else {
      config[key] = DEFAULT_CONFIG[key]
    }
  })
}

applyInitial(props.initialConfig)

watch(
  () => props.initialConfig,
  (value) => applyInitial(value),
)

function resetConfig() {
  applyInitial(null)
  error.value = ''
}

function saveConfig() {
  if (!valid.value) {
    error.value = '请先修正表单错误'
    return
  }
  error.value = ''
  emit('save', { ...config })
}
</script>
