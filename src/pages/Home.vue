<script setup lang="ts">
import {ref, watchEffect} from "vue";
import type {BreadcrumbItem, DropdownMenuItem} from "@nuxt/ui";
import {useRouter} from "vue-router";
import {useUserStore} from "@/store";
import MenuAPI from "@/api/system/menu-api.ts";
import FileApi from "@/api/file-api";
import {ElMessageBox} from "element-plus";
import authApi from "@/api/system/auth-api.ts";

const router = useRouter();
const userStore = useUserStore();

const items = ref<BreadcrumbItem[]>([]);
const navigationUi = {
  link: "rounded-lg px-4 py-3 text-sm",
  linkLeadingIcon: "size-5",
  linkLabel: "font-medium tracking-tight",
  childList: "mt-2 space-y-1 border-l border-[var(--library-border)] pl-4",
  childLink: "rounded-md px-3 py-2 text-sm",
  childLinkIcon: "size-4",
  childLinkLabel: "font-medium",
  label: "px-4 py-2 text-xs font-semibold tracking-[0.12em] text-[var(--library-text-muted)] uppercase"
};
const dropItems = ref<DropdownMenuItem[][]>([
  [
    {
      label: "个人中心",
      icon: "i-lucide-circle-user",
      to: {name: "Me"}
    },
  ],
  [
    {
      label: "退出登录",
      icon: "i-lucide-log-out",
      kbds: ["shift", "meta", "q"],
      onSelect: () => {
        ElMessageBox.confirm("确认退出登录吗？", "警告").then(async () => {
          await authApi.logout();
          await userStore.resetAllState();
          await router.push({name: "Login"});
        });
      }
    }
  ]
]);

function buildBreadcrumbs(route: { matched: { meta?: Record<string, unknown>; path: string }[] }): BreadcrumbItem[] {
  return route.matched
      .filter(r => r.meta?.title && r.meta.title !== "")
      .map(r => ({
        label: r.meta!.title as string,
        to: r.path
      }));
}

watchEffect(() => {
  items.value = buildBreadcrumbs(router.currentRoute.value);
});
</script>

<template>
  <div class="home-shell">
    <UDashboardGroup class="admin-layout h-screen overflow-hidden">
      <UDashboardSidebar
          collapsible
          resizable
          :default-size="17"
          :min-size="12"
          :max-size="22"
          :ui="{
            root: 'border-r border-default bg-default',
            header: 'px-4 pt-5 pb-4',
            body: 'px-3 py-2',
            footer: 'px-3 pb-4 pt-4 border-t-0'
          }"
      >
        <template #header="{ collapsed }">
          <div class="sidebar-brand-shell">
            <Logo :collapsed="collapsed" />
          </div>
        </template>

        <template #default="{ collapsed }">
          <UNavigationMenu
              :collapsed="collapsed"
              :items="MenuAPI.getMenus()"
              :ui="navigationUi"
              orientation="vertical"
          />
        </template>

        <template #footer="{ collapsed }">
          <div v-if="!collapsed" class="sidebar-footer-spacer" />
        </template>
      </UDashboardSidebar>

      <div class="main-stage">
        <UDashboardNavbar
            :ui="{
              root: 'sticky top-0 z-10 border-b border-default/70 bg-default px-4 py-3',
              left: 'gap-3 min-w-0',
              right: 'gap-3'
            }"
        >
          <template #left>
            <UBreadcrumb :items="items" class="navbar-breadcrumb">
              <template #separator>
                <span class="mx-2 text-(--library-text-muted)">/</span>
              </template>
            </UBreadcrumb>
            <UDashboardSidebarCollapse class="rounded-full border border-default/70 bg-default/70" />
          </template>

          <template #right>
            <UColorModeSelect
                class="color-mode-select w-28"
                color="neutral"
                variant="ghost"
                size="sm"
                :search-input="false"
            />
            <UDropdownMenu :items="dropItems">
              <UButton
                  :avatar="{ src: FileApi.resolveUrl(userStore.userInfo.avatar) }"
                  :label="userStore.userInfo.nickname || '当前账号'"
                  color="neutral"
                  variant="ghost"
                  class="user-menu-trigger"
              />
            </UDropdownMenu>
          </template>
        </UDashboardNavbar>

        <div class="content-stage">
          <RouterView />
        </div>
      </div>
    </UDashboardGroup>
  </div>
</template>

<style scoped>
.home-shell {
  height: 100vh;
  background: var(--library-surface);
}

.admin-layout {
  background: transparent;
}

.sidebar-brand-shell {
  padding-inline: 4px;
}

.sidebar-footer-spacer {
  min-height: 12px;
}

.main-stage {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
}

.navbar-breadcrumb {
  min-width: 0;
  order: 2;
}

.color-mode-select {
  min-width: 110px;
}

.user-menu-trigger {
  border-radius: 9999px;
  padding-inline: 10px;
  border: 1px solid color-mix(in srgb, var(--library-border) 82%, transparent);
  background: color-mix(in srgb, var(--library-card) 68%, transparent);
}

.content-stage {
  min-height: 0;
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 16px 18px 22px;
}

@media (max-width: 1024px) {
  .content-stage {
    padding: 14px 14px 18px;
  }
}

@media (max-width: 768px) {
  .navbar-breadcrumb {
    display: none;
  }

  .color-mode-select {
    width: 92px;
  }

  .content-stage {
    padding: 10px 10px 14px;
  }
}
</style>
