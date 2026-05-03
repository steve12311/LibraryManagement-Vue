import {type ConfigEnv, type UserConfig, loadEnv, defineConfig} from "vite";
import vue from '@vitejs/plugin-vue'
import ui from '@nuxt/ui/vite'
import {resolve} from "path";

const pathSrc = resolve(__dirname, "src");
type PostcssOptions = Exclude<NonNullable<NonNullable<UserConfig["css"]>["postcss"]>, string>;
type PostcssPlugin = NonNullable<PostcssOptions["plugins"]>[number];

// 修正 markstream-vue 发布包中遗留的 Vue deep 选择器，避免 Lightning CSS 压缩告警。
const markstreamDeepSelectorPatch: PostcssPlugin = {
    postcssPlugin: "markstream-deep-selector-patch",
    Rule(rule) {
        if (rule.selector.includes(".icon-slot :deep(svg)")) {
            rule.selector = rule.selector.replace(/\.icon-slot\s+:deep\(svg\)/g, ".icon-slot svg");
        }
    },
};

// https://vite.dev/config/
export default defineConfig(({mode}: ConfigEnv): UserConfig => {
    const env = loadEnv(mode, process.cwd());
    return {
        plugins: [vue(), ui({colorMode: true, dts: false})],
        css: {
            postcss: {
                plugins: [markstreamDeepSelectorPatch],
            },
        },
        build: {
            rolldownOptions: {
                output: {
                    codeSplitting: {
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
