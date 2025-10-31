<script setup lang="ts">

const emits = defineEmits<{
  addRow: [],
  deleteRow: [],
  modifyRow: []
  flush: [],
}>()
withDefaults(defineProps<{
  table: any,
  addDisabled?: boolean,
  deleteDisabled?: boolean,
  modifyDisabled?: boolean,
}>(), {
  addDisabled: false,
  deleteDisabled: false,
  modifyDisabled: false,
})
</script>

<template>
  <div class="flex justify-between">
    <div class="flex gap-4">
      <UButton icon="i-lucide-plus" :disabled="addDisabled" @click="emits('addRow')" variant="subtle" label="新增"/>
      <UButton icon="i-lucide-clipboard-pen-line" :disabled="modifyDisabled" @click="emits('modifyRow')"
               variant="subtle" label="修改"
               color="info"/>
      <UButton icon="i-lucide-trash-2" variant="subtle" :disabled="deleteDisabled" @click="emits('deleteRow')"
               label="删除" color="error"/>
    </div>
    <div class="flex gap-4">
      <UTooltip text="刷新" :delay-duration="0">
        <UButton @click="emits('flush')" class="rounded-full" color="neutral" variant="outline"
                 icon="i-lucide-refresh-ccw"/>
      </UTooltip>
      <UDropdownMenu
          :items="table?.tableApi?.getAllColumns()
              .filter((column:any) => {
                if (typeof column.columnDef?.header === 'function'){
                  return
                }
                return column.getCanHide()
              })
              .map((column:any) =>({
              label: column.columnDef.header as string,
              type: 'checkbox' as const,
              checked: column.getIsVisible(),
              onUpdateChecked(checked: boolean) {
                table?.tableApi?.getColumn(column.id)?.toggleVisibility(checked)
              },
              onSelect(e: Event) {
                e.preventDefault()
              }
              }))
"
      >
        <UButton label="显示/隐藏列" color="neutral" variant="outline" trailing-icon="i-lucide-chevron-down"/>
      </UDropdownMenu>
    </div>
  </div>
</template>

<style scoped>

</style>