import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import router from "./router/router.ts";
import ui from '@nuxt/ui/vue-plugin'
import {pinia} from "./store";
import {setupPermission} from "./utils/permission.ts";
import 'element-plus/dist/index.css'

createApp(App).use(pinia).use(router).use(ui).mount('#app')

setupPermission()
