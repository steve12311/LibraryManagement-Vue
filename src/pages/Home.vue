<script setup lang="ts">
import {ref, watchEffect} from "vue";
import type {BreadcrumbItem, DropdownMenuItem} from '@nuxt/ui'
import {useRouter} from "vue-router";
import {useStore} from "../store/store.ts";

const router = useRouter()
const store = useStore()

const items = ref<BreadcrumbItem[]>([])
const dropItems = ref<DropdownMenuItem[][]>([
  [
    {
      label: "个人中心",
      icon: "i-lucide-circle-user",
    },
  ],
  [
    {
      label: "退出登录",
      icon: "i-lucide-log-out",
      kbds: ["shift", "meta", "q"],
      onSelect: () => {
        store.token = ""
        router.push({name: "Login"})
      }
    }
  ]
])

watchEffect(() => {
  items.value = router.currentRoute.value.matched
      .filter(route => route.meta?.title && route.meta.title !== '')
      .map(route => ({
        label: route.meta.title as string,
        ...(route.meta.isRouter === true && {to: route.path})
      }))
})
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar collapsible resizable :ui="{ footer: 'border-t border-default' }">
      <template #header="{ collapsed }">
        <Logo/>
        <div v-if="!collapsed" class="font-bold text-xl">图书管理系统</div>
      </template>
      <template #default="{ collapsed }">
        <UNavigationMenu
            :collapsed="collapsed"
            :items="store.menus"
            orientation="vertical"
        />
      </template>
      <template #footer="{ collapsed }">
        <UDropdownMenu :items="dropItems">
          <UButton
              :avatar="{
          src: store.user?.avatar
        }"
              :label="collapsed ? undefined : `${store.user?.nickName}`"
              color="neutral"
              variant="ghost"
              class="w-full"
              :block="collapsed"
          />
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>
    <div class="w-full">
      <UDashboardNavbar>
        <template #leading>
          <UDashboardSidebarCollapse/>
        </template>
        <template #trailing>
          <UBreadcrumb :items="items">
            <template #separator>
              <span class="mx-2 text-muted">/</span>
            </template>
          </UBreadcrumb>
        </template>
      </UDashboardNavbar>
      <div class="h-full p-4">
        <RouterView/>
      </div>
    </div>
  </UDashboardGroup>
</template>

<style scoped>

</style>