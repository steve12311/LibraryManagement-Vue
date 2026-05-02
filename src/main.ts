import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import setupPlugins from "@/plugins"
import 'element-plus/dist/index.css'

document.title = import.meta.env.VITE_APP_BRAND_TITLE || '校园图书馆'
createApp(App).use(setupPlugins).mount('#app')
