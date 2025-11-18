<script setup lang="ts">
import {h, onMounted, ref, resolveComponent} from "vue";
import type {Page, PageInfo, Response} from "../utils/Common.ts";
import {get} from "../api/request.ts"
import type {TableColumn} from "@nuxt/ui";
import moment from "moment";

const UCheckbox = resolveComponent('UCheckbox')
const UBadge = resolveComponent('UBadge')

const dataList = ref<any>([])
const pagination = ref<Page>({
  pageNum: 1,
  pageSize: 10,
  total: 0,
})
const columns = ref<TableColumn<any>[]>([
  {
    id: "select",
    header: ({table}) => {
      return h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
            ? 'indeterminate'
            : table.getIsAllPageRowsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
            table.toggleAllPageRowsSelected(!!value),
        'aria-label': '选择全部'
      })
    },
    cell: ({row}) => {
      return h(UCheckbox, {
        modelValue: row.getIsSelected(),
        'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
        'aria-label': '选择单行'
      })
    }
  },
  {
    accessorKey: "borrowId",
    header: "借阅订单"
  },
  {
    accessorKey: "bookId",
    header: "书籍ID"
  },
  {
    accessorKey: "bookName",
    header: "名称"
  },
  {
    accessorKey: "userName",
    header: "借阅用户"
  },
  {
    accessorKey: "returnTime",
    header: "预计归还日期",
    cell: ({row}) => moment(row.original.returnTime).format("YYYY-MM-DD"),
  },
  {
    id: "status",
    header: "状态",
    cell: ({row}) => {
      return h(UBadge, {
            class: 'capitalize',
            variant: 'subtle',
            color: getBorrowStatus(row.original)
          }, () =>
              getBorrowText(row.original)
      )
    },
  }
])

onMounted(() => {
  getBorrowList()
})

function getBorrowText(row: any) {
  const returnTime = new Date(moment(row.returnTime).format('YYYY-MM-DD'))
  if (row.realityReturnTime === null) {
    if (row.payFlag !== 1) {
      return "未归还"
    } else {
      return "已买断"
    }
  }
  const realityReturnTime = new Date(moment(row.realityReturnTime).format('YYYY-MM-DD'))
  if (returnTime >= realityReturnTime) {
    return "已归还"
  }
}

function getBorrowStatus(row: any) {
  const returnTime = new Date(moment(row.returnTime).format('YYYY-MM-DD'))
  if (row.realityReturnTime === null) {
    if (row.payFlag !== 1) {
      return "info"
    } else {
      return "neutral"
    }
  }
  const realityReturnTime = new Date(moment(row.realityReturnTime).format('YYYY-MM-DD'))
  if (returnTime >= realityReturnTime) {
    return "success"
  }
}

async function getBorrowList() {
  const {data} = await get<Response<PageInfo<any>>>("lib/borrow/list", {
    params: pagination.value,
  })
  dataList.value = data.data.records
  pagination.value.total = data.data.total
}
</script>

<template>
  <UCard>
    <template #header>
      1111
    </template>
    <UTable :data="dataList" :columns="columns"/>
  </UCard>
</template>

<style scoped>

</style>