<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from "vue";
import { ElTree } from "element-plus";
import type { TreeInstance } from "element-plus";
import {
  collectReplayCheckedMenuIds,
  type RoleMenuOption,
} from "@/composables/system/role/useRoleMenuAssign";

const props = defineProps<{
  open: boolean
  roleName: string
  menuTreeOptions: RoleMenuOption[]
  assignedMenuIds: number[]
  submitting: boolean
}>()

const emit = defineEmits<{
  "update:open": [boolean]
  submit: [number[]]
}>()

const assignMenuTree = useTemplateRef<TreeInstance>("assignMenuTree")
const menuTreeProps = {
  label: "label",
  children: "children"
} as const

watch(() => props.open, async (isOpen) => {
  if (!isOpen) return
  await nextTick()
  assignMenuTree.value?.setCheckedKeys(
      collectReplayCheckedMenuIds(props.menuTreeOptions, props.assignedMenuIds)
  )
})

function getSelectedMenuIds() {
  const checkedKeys = assignMenuTree.value?.getCheckedKeys(false) ?? []
  const halfCheckedKeys = assignMenuTree.value?.getHalfCheckedKeys() ?? []
  return Array.from(new Set(
      [...checkedKeys, ...halfCheckedKeys]
          .map((item) => Number(item))
          .filter((item) => Number.isInteger(item) && item > 0)
  ))
}

function getMenuOptionLabel(node: RoleMenuOption) {
  return node.label || "-"
}

function getMenuOptionTag(node: RoleMenuOption) {
  return node.tag?.trim() || ""
}
</script>

<template>
  <UModal
      :open="open"
      :title="`分配菜单${roleName ? ` - ${roleName}` : ''}`"
      :ui="{ content: 'sm:max-w-3xl rounded-[28px] border-0 bg-white shadow-[var(--library-shadow)]' }"
      @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <div class="system-modal-copy">
          <p class="system-modal-title">分配菜单</p>
          <p class="system-modal-description">勾选后保存，即可更新当前角色的菜单与按钮权限。</p>
        </div>
        <div class="max-h-[420px] overflow-auto rounded-lg border border-default p-3">
          <ElTree
              ref="assignMenuTree"
              node-key="value"
              show-checkbox
              default-expand-all
              :data="menuTreeOptions"
              :props="menuTreeProps"
              empty-text="暂无可分配菜单"
          >
            <template #default="{ data }">
              <div class="flex min-w-0 flex-1 items-center justify-between gap-3 py-1 pr-2">
                <span class="truncate text-sm text-highlighted">{{ getMenuOptionLabel(data) }}</span>
                <div class="flex min-w-0 items-center gap-2 text-xs text-muted">
                  <span v-if="getMenuOptionTag(data)" class="truncate">
                    {{ getMenuOptionTag(data) }}
                  </span>
                </div>
              </div>
            </template>
          </ElTree>
        </div>
      </div>
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton label="取消" variant="ghost" @click="emit('update:open', false)" />
        <UButton label="保存" :loading="submitting" @click="emit('submit', getSelectedMenuIds())" />
      </div>
    </template>
  </UModal>
</template>
