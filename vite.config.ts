import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue(), ui()],
    server: {
        proxy: {
            "/system": {
                target: "http://localhost:8080",
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/system/, ''),
            }
        }
    }
})
