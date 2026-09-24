<template>
  <div class="musicdl-page">
    <v-card variant="flat">
      <v-card-item>
        <v-card-title class="d-flex align-center">
          <v-icon class="mr-2">mdi-music-search</v-icon>
          MusicDL 歌曲搜索
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

        <!-- 搜索栏 -->
        <v-row dense align="center">
          <v-col cols="12" md="9">
            <v-text-field
              v-model="keyword"
              label="搜索歌曲"
              placeholder="输入歌名 / 歌手 / 专辑关键词"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              prepend-inner-icon="mdi-magnify"
              :loading="loading"
              @keyup.enter="search"
            >
              <template #append>
                <v-btn color="primary" :loading="loading" @click="search">
                  <v-icon start>mdi-magnify</v-icon>
                  搜索
                </v-btn>
              </template>
            </v-text-field>
          </v-col>
          <v-col cols="12" md="3">
            <v-btn variant="text" block :disabled="loading" @click="reset">清空</v-btn>
          </v-col>
        </v-row>

        <!-- 结果概览与下载操作 -->
        <div v-if="searched" class="d-flex align-center flex-wrap ga-2 mt-4">
          <v-chip size="small" color="primary" variant="tonal">{{ totalCount }} 首结果</v-chip>
          <v-chip size="small" variant="tonal">{{ sources.length }} 个音源</v-chip>
          <v-switch
            v-model="background"
            color="primary"
            density="compact"
            hide-details
            label="后台下载"
            class="ml-2"
          />
          <v-spacer />
          <v-btn color="primary" :disabled="!selectedCount" :loading="downloading" @click="downloadSelected">
            <v-icon start>mdi-download</v-icon>
            下载所选（{{ selectedCount }}）
          </v-btn>
        </div>

        <v-skeleton-loader v-if="loading" type="list-item-two-line@4" class="mt-4" />

        <div v-else-if="searched && !totalCount" class="text-medium-emphasis mt-6 text-center">
          没有搜索到歌曲，换个关键词试试
        </div>

        <!-- 分组结果列表 -->
        <v-expansion-panels v-else-if="totalCount" class="mt-4" variant="accordion" multiple>
          <v-expansion-panel v-for="source in sources" :key="source">
            <v-expansion-panel-title>
              <v-icon start size="small">mdi-music-box-multiple</v-icon>
              <span class="font-weight-medium">{{ source }}</span>
              <v-chip size="x-small" variant="tonal" class="ml-2">{{ songList(source).length }}</v-chip>
            </v-expansion-panel-title>
            <v-expansion-panel-text>
              <div class="d-flex align-center mb-2">
                <v-checkbox-btn
                  :model-value="isAllSelected(source)"
                  :indeterminate="isPartiallySelected(source)"
                  density="compact"
                  hide-details
                  @update:model-value="(value) => toggleSource(source, value)"
                />
                <span class="text-caption text-medium-emphasis">全选本音源</span>
              </div>

              <v-list density="compact" class="pa-0">
                <v-list-item v-for="(song, index) in songList(source)" :key="index" :value="index">
                  <template #prepend>
                    <v-checkbox-btn v-model="selectedKeys" :value="`${source}#${index}`" density="compact" />
                  </template>
                  <v-list-item-title>{{ songName(song) }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ singersText(song) }}
                    <template v-if="song.album"> · {{ song.album }}</template>
                  </v-list-item-subtitle>
                  <template #append>
                    <div class="text-caption text-medium-emphasis text-right">
                      <div>{{ durationText(song) }}</div>
                      <div>{{ sizeText(song) }}</div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-card-text>

      <v-divider />
      <v-card-actions>
        <span class="text-caption text-medium-emphasis pl-2">
          歌词、封面与标签由 MoviePilot 刮削流程写入
        </span>
        <v-spacer />
        <v-btn variant="text" @click="emit('switch')">
          <v-icon start>mdi-cog</v-icon>
          配置
        </v-btn>
      </v-card-actions>
    </v-card>
  </div>
</template>

<script setup>
import { computed, inject, ref } from 'vue'

const props = defineProps({
  api: { type: Object, default: () => ({}) },
  pluginId: { type: String, default: 'MusicDl' },
  sourcePluginId: { type: String, default: '' },
  nativeSubscribe: { type: Function, default: null },
})

const emit = defineEmits(['action', 'switch', 'close'])
const toast = inject('moviepilot:toast', null)

const keyword = ref('')
const loading = ref(false)
const downloading = ref(false)
const error = ref('')
const searched = ref(false)
// musicdl /search 返回结构：{ 音源名: [SongInfo, ...] }
const grouped = ref({})
const selectedKeys = ref([])
const background = ref(true)

const sources = computed(() => Object.keys(grouped.value))
const totalCount = computed(() =>
  sources.value.reduce((sum, source) => sum + songList(source).length, 0),
)
const selectedCount = computed(() => selectedKeys.value.length)

function songList(source) {
  const list = grouped.value[source]
  return Array.isArray(list) ? list : []
}

function unwrap(response) {
  // 宿主 envelope 形如 { success, message, data }；插件自定义结构则原样返回
  if (response && typeof response === 'object' && !Array.isArray(response)) {
    const keys = Object.keys(response)
    const isEnvelope =
      keys.length === 3 && keys.every((key) => ['success', 'message', 'data'].includes(key))
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
  const singers = song?.singers
  if (Array.isArray(singers)) {
    return singers.filter(Boolean).join(' / ') || '未知歌手'
  }
  return singers || '未知歌手'
}

function durationText(song) {
  if (song?.duration) return song.duration
  const seconds = Number(song?.duration_s)
  if (!Number.isFinite(seconds) || seconds <= 0) return ''
  const minutes = Math.floor(seconds / 60)
  const rest = Math.floor(seconds % 60)
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

function sizeText(song) {
  return song?.file_size || ''
}

function sourceKeys(source) {
  return songList(source).map((_, index) => `${source}#${index}`)
}

function isAllSelected(source) {
  const keys = sourceKeys(source)
  return keys.length > 0 && keys.every((key) => selectedKeys.value.includes(key))
}

function isPartiallySelected(source) {
  const keys = sourceKeys(source)
  const picked = keys.filter((key) => selectedKeys.value.includes(key)).length
  return picked > 0 && picked < keys.length
}

function toggleSource(source, value) {
  const keys = sourceKeys(source)
  const next = new Set(selectedKeys.value)
  keys.forEach((key) => (value ? next.add(key) : next.delete(key)))
  selectedKeys.value = [...next]
}

function reset() {
  keyword.value = ''
  grouped.value = {}
  selectedKeys.value = []
  searched.value = false
  error.value = ''
}

async function search() {
  const kw = keyword.value?.trim()
  if (!kw) {
    toast?.warning('请输入搜索关键词')
    return
  }
  loading.value = true
  error.value = ''
  selectedKeys.value = []
  try {
    const data = unwrap(await props.api.post(`plugin/${props.pluginId}/search`, { keyword: kw }))
    if (data && typeof data === 'object' && data.success === false) {
      grouped.value = {}
      error.value = data.message || '搜索失败'
    } else if (data && typeof data === 'object' && !Array.isArray(data)) {
      grouped.value = data
    } else {
      grouped.value = {}
      error.value = '搜索返回格式异常'
    }
  } catch (err) {
    grouped.value = {}
    error.value = err?.message || '搜索请求失败'
  } finally {
    searched.value = true
    loading.value = false
  }
}

async function downloadSelected() {
  const songs = []
  sources.value.forEach((source) => {
    songList(source).forEach((song, index) => {
      if (selectedKeys.value.includes(`${source}#${index}`)) {
        songs.push(song)
      }
    })
  })
  if (!songs.length) {
    toast?.warning('请先选择要下载的歌曲')
    return
  }
  downloading.value = true
  error.value = ''
  try {
    const result = unwrap(
      await props.api.post(`plugin/${props.pluginId}/download`, {
        songs,
        background: background.value,
      }),
    )
    if (result && result.success === false) {
      error.value = result.message || '下载失败'
      toast?.error(error.value)
      return
    }
    toast?.success(result?.message || `已提交 ${songs.length} 首歌曲的下载任务`)
    selectedKeys.value = []
    emit('action')
  } catch (err) {
    error.value = err?.message || '下载请求失败'
    toast?.error(error.value)
  } finally {
    downloading.value = false
  }
}
</script>

<style scoped>
.musicdl-page :deep(.v-expansion-panel-title) {
  min-height: 48px;
}
</style>
