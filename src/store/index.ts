import type {App} from "vue";
import {createPinia} from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export function setupStore(app: App<Element>) {
    app.use(pinia);
}

export * from "./modules/auth-store.ts"
export * from "./modules/user-store.ts"
export {pinia}
