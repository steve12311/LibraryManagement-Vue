import {type ConfigEnv, type UserConfig, loadEnv, defineConfig} from "vite";
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import {resolve} from "path";

const pathSrc = resolve(__dirname, "src");

// https://vite.dev/config/
export default defineConfig(({mode}: ConfigEnv): UserConfig => {
    const env = loadEnv(mode, process.cwd());
    return {
        plugins: [vue(), ui()],
        resolve: {
            alias: {
                "@": pathSrc,
            },
        },
        server: {
            port: +env.VITE_APP_PORT,
            proxy: {
                "/system": {
                    target: env.VITE_APP_API_URL,
                    changeOrigin: true,
                    rewrite: (path: string) => path.replace(new RegExp("^" + env.VITE_APP_BASE_API), ""),
                }
            }
        }
    }
})
