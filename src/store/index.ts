import {createPinia} from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

export * from "./modules/auth-store.ts"
export * from "./modules/user-store.ts"
export {pinia}