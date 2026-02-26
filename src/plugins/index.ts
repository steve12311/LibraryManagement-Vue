import type {App} from "vue";
import ui from "@nuxt/ui/vue-plugin";
import {setupRouter} from "@/router";
import {setupStore} from "@/store";
import {setupPermission} from "@/plugins/permission.ts";

export default {
    install(app: App<Element>) {
        setupStore(app);
        setupRouter(app);
        app.use(ui);
        setupPermission();
    },
};
