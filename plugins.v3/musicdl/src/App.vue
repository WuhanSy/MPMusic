<template>
  <v-app>
    <v-main>
      <v-container>
        <Page :api="api" plugin-id="MusicDl" />
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import Page from './components/Page.vue'

// 独立调试时提供一个最小 api stub，宿主环境会注入真实实例
const api = {
  get: async () => ({}),
  post: async () => ({}),
}
</script>
