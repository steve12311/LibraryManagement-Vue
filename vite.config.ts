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
        build: {
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (!id.includes("node_modules")) return;

                        if (id.includes("markstream-vue/dist/index8.js")) {
                            return "ai-diagram-heavy";
                        }

                        if (id.includes("markstream-vue")) {
                            return "ai-markdown";
                        }

                        if (
                            id.includes("/node_modules/ai/")
                            || id.includes("@ai-sdk")
                        ) {
                            return "ai-runtime";
                        }

                        if (id.includes("@nuxt/ui")) {
                            return "nuxt-ui";
                        }

                        if (id.includes("element-plus")) {
                            return "element-plus";
                        }

                        if (id.includes("/node_modules/moment/")) {
                            return "moment";
                        }

                        if (
                            id.includes("/node_modules/vue/")
                            || id.includes("/node_modules/vue-router/")
                            || id.includes("/node_modules/pinia/")
                        ) {
                            return "vue-core";
                        }
                    }
                }
            }
        },
        resolve: {
            alias: {
                "@": pathSrc,
            },
        },
        server: {
            port: +env.VITE_APP_PORT,
        }
    }
})
