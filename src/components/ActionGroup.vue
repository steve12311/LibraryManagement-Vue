<script setup lang="ts">
import {computed} from "vue";
import type {DropdownMenuItem} from "@nuxt/ui";

interface ActionGroupColumn {
  id: string
  columnDef?: {
    header?: string | ((...args: never[]) => unknown)
  }
  getCanHide(): boolean
  getIsVisible(): boolean
}

interface ActionGroupTableApi {
  getFilteredSelectedRowModel(): {
    flatRows: unknown[]
  }
  getAllColumns(): ActionGroupColumn[]
  getColumn(columnId: string): {
    toggleVisibility(checked: boolean): void
  } | undefined
}

interface ActionGroupTable {
  tableApi?: ActionGroupTableApi
}

const emits = defineEmits(['addRow', 'deleteRow', 'modifyRow', 'flush'])

const props = defineProps<{
  table?: ActionGroupTable,
}>()

const selectedRowCount = computed(() => props.table?.tableApi?.getFilteredSelectedRowModel().flatRows.length ?? 0)

const dropdownItems = computed<DropdownMenuItem[][]>(() => [
  (props.table?.tableApi?.getAllColumns() ?? [])
      .filter((column) => {
        if (typeof column.columnDef?.header === "function") {
          return false
        }
        return column.getCanHide()
      })
      .map((column) => {
        const header = column.columnDef?.header

        return {
          label: typeof header === "string" ? header : "",
          type: "checkbox" as const,
          checked: column.getIsVisible(),
          onUpdateChecked(checked: boolean) {
            props.table?.tableApi?.getColumn(column.id)?.toggleVisibility(checked)
          },
          onSelect(event: Event) {
            event.preventDefault()
          }
        }
      })
])
</script>

<template>
  <div class="flex justify-between">
    <div class="flex gap-4">
      <slot>
        <UButton icon="i-lucide-plus" @click="emits('addRow')" variant="subtle" label="新增"/>
        <UButton icon="i-lucide-clipboard-pen-line"
                 :disabled="selectedRowCount !== 1"
                 @click="emits('modifyRow')"
                 variant="subtle" label="修改"
                 color="info"/>
        <UButton icon="i-lucide-trash-2" variant="subtle"
                 :disabled="selectedRowCount === 0"
                 @click="emits('deleteRow')"
                 label="删除" color="error"/>
      </slot>
    </div>
    <div class="flex gap-4">
      <UTooltip text="刷新" :delay-duration="0">
        <UButton @click="emits('flush')" class="rounded-full" color="neutral" variant="outline"
                 icon="i-lucide-refresh-ccw"/>
      </UTooltip>
      <UDropdownMenu
          :items="dropdownItems"
      >
        <UButton label="显示/隐藏列" color="neutral" variant="outline" trailing-icon="i-lucide-chevron-down"/>
        <slot name="behind"></slot>
      </UDropdownMenu>
    </div>
  </div>
</template>

<style scoped>

</style>
