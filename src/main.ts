import {createApp} from 'vue'
import './style.css'
import App from './App.vue'
import router from "./router/router.ts";
import ui from '@nuxt/ui/vue-plugin'
import {pinia} from "./store/store.ts";
import {initMenus, initRouter} from "./utils/Common.ts";

const app = createApp(App)
app.use(pinia)
initMenus(initRouter())
app.use(router)
app.use(ui)
app.mount('#app')
