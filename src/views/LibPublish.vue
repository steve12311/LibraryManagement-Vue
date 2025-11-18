<script setup lang="ts">
import {h, onMounted, ref, resolveComponent, watch} from "vue";
import {get} from "../api/request.ts"
import type {Page, PageInfo, Response} from "../utils/Common.ts";
import type {TableColumn} from "@nuxt/ui";
import moment from "moment/moment";

const UCheckbox = resolveComponent('UCheckbox')

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
    accessorKey: "publishId",
    header: "ID",
  },
  {
    accessorKey: "publishName",
    header: "出版社名称"
  },
  {
    accessorKey: "address",
    header: "地址"
  },
  {
    accessorKey: "addressCode",
    header: "邮编"
  },
  {
    accessorKey: "phonenumber",
    header: "联系电话"
  },
  {
    accessorKey: "createTime",
    header: "创建时间",
    cell: ({row}) => moment(row.original.createTime).format("YYYY-MM-DD HH:mm:ss"),
  }
])

watch(pagination.value, getPublishList)
onMounted(() => {
  getPublishList()
})

async function getPublishList() {
  const {data} = await get<Response<PageInfo<any>>>("lib/publish/list", {
    params: pagination.value,
  })
  dataList.value = data.data.records
  pagination.value.total = data.data.total
}
</script>

<template>
  <UCard>
    <template #header>
      11111
    </template>
    <UTable :data="dataList" :columns="columns"/>
    <template #footer>
      <div class="flex justify-center border-default pt-4">
        <UPagination v-model:page="pagination.pageNum" :total="pagination.total"
                     :items-per-page="pagination.pageSize"/>
      </div>
    </template>
  </UCard>
</template>

<style scoped>

</style>