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
const columnVisibility = ref({
  bookId: false,
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
    id: "bookId",
    accessorKey: "bookId",
    header: "ID"
  },
  {
    id: "bookImage",
    accessorKey: "bookImage",
    header: "封面",
    cell: ({row}) => {
      return h("div", {
        style: {
          height: "120px",
          width: "80px"
        }
      }, [
        h("img", {
          src: row.original.bookImage,
          style: {
            height: "100%",
          }
        }, undefined)
      ])
    }
  },
  {
    id: "isbn",
    accessorKey: "isbn",
    header: "ISBN"
  },
  {
    id: "bookName",
    accessorKey: "bookName",
    header: "名称"
  },
  {
    id: "author",
    accessorKey: "author",
    header: "作者",
  },
  {
    id: "publishName",
    accessorKey: "publishName",
    header: "出版社"
  },
  {
    id: "publishTime",
    accessorKey: "publishTime",
    header: "出版日期",
    cell: ({row}) => moment(row.original.publishTime).format("YYYY-MM")
  },
  {
    id: "category",
    accessorKey: "categoryName",
    header: "分类"
  },
  {
    id: "stock",
    header: "库存",
    cell: ({row}) => `${row.original.stockNumber}/${row.original.currentNumber}`,
  },
  {
    id: "createTime",
    accessorKey: "createTime",
    header: "入库日期",
    cell: ({row}) => moment(row.original.createTime).format("YYYY-MM-DD HH:mm:ss"),
  }
])

watch(pagination.value, getStockList)
onMounted(() => {
  getStockList()
})

async function getStockList() {
  const {data} = await get<Response<PageInfo<any>>>("lib/stock/list", {
    params: pagination.value,
  });
  dataList.value = data.data.records;
  pagination.value.total = data.data.total;
}
</script>

<template>
  <UCard>
    <template #header>
      1111
    </template>
    <UTable :column-visibility="columnVisibility" :columns="columns" :data="dataList"/>
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