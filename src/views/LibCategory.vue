<script setup lang="ts">
import {get} from "../api/request.ts"
import {h, onMounted, ref, resolveComponent} from "vue";
import type {Response} from "../utils/Common.ts";
import type {TableColumn} from "@nuxt/ui";
import moment from "moment/moment";

const UButton = resolveComponent('UButton')

const dataList = ref<any>([])
const columns = ref<TableColumn<any>[]>([
  {
    accessorKey: "categoryId",
    header: "分类ID"
  },
  {
    accessorKey: "code",
    header: "分类代码"
  },
  {
    accessorKey: "categoryName",
    header: "分类名称",
    cell: ({row}) => {
      return h("div", {
        style: {
          paddingLeft: `${row.depth}rem`
        },
        class: 'flex items-center gap-2'
      }, [
        h(UButton, {
          icon: row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus',
          class: !row.getCanExpand() && 'invisible',
          size: 'xs',
          onClick: row.getToggleExpandedHandler()
        }),
        row.getValue('categoryName') as string
      ])
    }
  },
  {
    accessorKey: "createTime",
    header: "创建日期",
    cell: ({row}) => moment(row.original.createTime).format("YYYY-MM-DD HH:mm:ss"),
  }
])
const columnVisibility = ref({
  categoryId: false
})

onMounted(() => {
  getCategoryList()
})

async function getCategoryList() {
  const {data} = await get<Response<any>>("lib/category/list")
  dataList.value = data.data
}
</script>

<template>
  <UCard>
    <template #header>2222</template>
    <UTable :column-visibility="columnVisibility" :data="dataList" :columns="columns"
            :get-sub-rows="(row)=>row.children"
            :ui="{
      base: 'border-separate border-spacing-0',
      tbody: '[&>tr]:last:[&>td]:border-b-0',
      tr: 'group',
      td: 'empty:p-0 group-has-[td:not(:empty)]:border-b border-default'
    }"/>
  </UCard>
</template>

<style scoped>

</style>