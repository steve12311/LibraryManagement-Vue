import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import setupPlugins from "@/plugins";
import 'element-plus/dist/index.css'

createApp(App).use(setupPlugins).mount('#app')
