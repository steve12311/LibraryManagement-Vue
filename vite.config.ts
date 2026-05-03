import {type ConfigEnv, type UserConfig, loadEnv, defineConfig} from "vite";
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import {resolve} from "path";

const pathSrc = resolve(__dirname, "src");

// https://vite.dev/config/
export default defineConfig(({mode}: ConfigEnv): UserConfig => {
    const env = loadEnv(mode, process.cwd());
    return {
        plugins: [vue(), ui({colorMode: true, dts: false})],
        build: {
            rolldownOptions: {
                output: {
                    advancedChunks: {
                        groups: [
                            { name: "ai-diagram-heavy", test: /markstream-vue\/dist\/index8\.js/ },
                            { name: "ai-markdown", test: /markstream-vue/ },
                            { name: "ai-runtime", test: /\/node_modules\/ai\/|@ai-sdk/ },
                            { name: "dashboard-echarts", test: /\/node_modules\/echarts\// },
                            { name: "dashboard-zrender", test: /\/node_modules\/zrender\// },
                            { name: "nuxt-ui", test: /@nuxt\/ui/ },
                            { name: "element-plus", test: /element-plus/ },
                            { name: "vue-core", test: /\/node_modules\/vue\/|\/node_modules\/vue-router\/|\/node_modules\/pinia\// },
                        ],
                    },
                },
            },
        },
        resolve: {
            alias: {
                "@": pathSrc,
            },
        },
        server: {
            port: +env.VITE_APP_PORT,
        },
        preview:{
            port: +env.VITE_APP_PORT,
        }
    }
})
