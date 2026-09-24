import { createApp } from 'vue'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import 'vuetify/styles'
import App from './App.vue'

// 仅用于本地独立调试，宿主加载的是 remoteEntry 暴露的 Page/Config 组件
const vuetify = createVuetify({
  components,
  directives,
})

createApp(App).use(vuetify).mount('#app')
