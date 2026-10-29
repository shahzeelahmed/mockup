import 'frappe-ui/style.css'
import { createApp } from 'vue'
import Mockup from '@mockup/Mockup.vue'

window.__ = (text, args = []) =>
  String(text).replace(/\{(\d+)\}/g, (_, i) => args[i] ?? '')

const app = createApp(Mockup)
app.config.globalProperties.__ = window.__
app.mount('#app')
