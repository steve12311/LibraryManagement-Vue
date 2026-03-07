<script setup lang="ts">
import {h, onMounted, ref, resolveComponent, shallowRef, useTemplateRef} from "vue";
import type {SelectItem, TableColumn, TableRow} from "@nuxt/ui";
import moment from "moment";
import type {StockPageVO} from "@/api/library/stock-api.ts";
import type {BookForm} from "@/api/library/book-api.ts";
import {CalendarDate} from "@internationalized/date";
import StockOutDialog from "@/components/lib-stock/StockOutDialog.vue";
import EditBookDialog from "@/components/lib-stock/EditBookDialog.vue";
import StockDetailDialog from "@/components/lib-stock/StockDetailDialog.vue";
import StockEntryDialog from "@/components/lib-stock/StockEntryDialog.vue";
import {useStockQuery} from "@/composables/library/stock/useStockQuery";
import {useStockOptions} from "@/composables/library/stock/useStockOptions";
import {useStockOut} from "@/composables/library/stock/useStockOut";
import {useStockEdit} from "@/composables/library/stock/useStockEdit";

const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

onMounted(() => {
  void handleQuery()
})

const date = new Date()
const currentSelectedStock = ref<StockPageVO>()
const fieldItems = ref<SelectItem[]>([
  {
    label: "名称",
    value: "name"
  },
  {
    label: "作者",
    value: "author"
  },
  {
    label: "ISBN",
    value: "isbn"
  }
])
const open = ref(false)
const openEditBookDialog = ref(false)
const openStockOutDialog = ref(false)
const {queryParams, pageDate, total, loadingPageData, handleQuery, resetQuery, fetchData} = useStockQuery()
const {
  stockOutNumber,
  submittingStockOut,
  openStockOutModal,
  submitStockOut,
} = useStockOut({
  openStockOutDialog,
  fetchData,
})
const table = useTemplateRef("table")
const {
  publishOptions,
  categoryTreeOptions,
  categoryTreeCacheData,
  loadingOptions,
  ensureCategoryNodeCache,
  loadCategoryTreeNode,
  fetchEntryOptions,
} = useStockOptions()
const columns = ref<TableColumn<StockPageVO>[]>([
  {
    id: "bookImage",
    accessorKey: "bookImage",
    header: "封面",
    cell: ({row}) => {
      if (!row.original.bookImage) {
        return h("div", {class: "h-24 w-[72px] rounded-md border border-default bg-elevated/40 flex items-center justify-center"}, [
          h("span", {class: "text-xs text-muted"}, "暂无封面")
        ])
      }
      return h("div", {
        class: "h-24 w-[72px] overflow-hidden rounded-md border border-default bg-elevated"
      }, [
        h("img", {
          src: row.original.bookImage,
          alt: `${row.original.name}封面`,
          class: "h-full w-full object-cover"
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
    id: "name",
    accessorKey: "name",
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
    id: "stock",
    header: "库存",
    cell: ({row}) => h('div', undefined, [
      h('span', {class: ''}, `${row.original.currentNumber}/`),
      h('span', {class: 'font-medium text-highlighted'}, row.original.stockNumber)
    ]),
  },
  {
    id: "createTime",
    accessorKey: "createTime",
    header: "入库日期",
    cell: ({row}) => moment(row.original.createTime).format("YYYY-MM-DD HH:mm:ss"),
  },
  {
    id: "active",
    header: "操作",
    cell: ({row}) => h('div', {class: "flex items-center gap-1"}, [
      h(UTooltip, {text: "修改", delayDuration: 0}, () => [
        h(UButton, {
          icon: "i-lucide-clipboard-pen-line",
          variant: "ghost",
          loading: loadingEditBook.value && editingIsbn.value === row.original.isbn,
          onClick: (ev: Event) => {
            ev.stopPropagation();
            openEditBookModal(row.original.isbn)
          }
        }),
      ]),
      h(UTooltip, {text: "出库", delayDuration: 0}, () => [
        h(UButton, {
          icon: "i-lucide-archive-restore", variant: "ghost", onClick: (ev: Event) => {
            ev.stopPropagation();
            openStockOutModal(row.original)
          }
        }),
      ])
    ])
  }
])
const loadingEditBook = ref(false)
const submittingEditBook = ref(false)
const editingIsbn = ref("")
const openEntryStepper = ref(false)
const initialEditBookFormData: BookForm = {
  isbn: "",
  cover: "",
  name: "",
  intro: "",
  author: "",
  pressId: 0,
  publishTime: date,
  categoryId: 0,
  price: 0,
}
const editBookState = ref<BookForm>({...initialEditBookFormData})
const editBookCoverModel = ref<File>()
const editBookPublishTime = shallowRef(new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()))
const {
  openEntryModal,
  openEditBookModal,
  submitEditBook,
} = useStockEdit({
  openEditBookDialog,
  openEntryStepper,
  loadingOptions,
  loadingEditBook,
  submittingEditBook,
  editingIsbn,
  editBookState,
  editBookCoverModel,
  editBookPublishTime,
  categoryTreeCacheData,
  initialEditBookFormData,
  fetchEntryOptions,
  ensureCategoryNodeCache,
  fetchData,
})

function showBookDetailInfo(_: unknown, row: TableRow<StockPageVO>) {
  open.value = true
  currentSelectedStock.value = row.original
}

</script>

<template>
  <StockOutDialog
      v-model:open="openStockOutDialog"
      v-model:stock-out-number="stockOutNumber"
      :submitting="submittingStockOut"
      @submit="submitStockOut"
  />
  <EditBookDialog
      v-model:open="openEditBookDialog"
      v-model:state="editBookState"
      v-model:cover-model="editBookCoverModel"
      v-model:publish-time="editBookPublishTime"
      :publish-options="publishOptions"
      :category-tree-options="categoryTreeOptions"
      :category-tree-cache-data="categoryTreeCacheData"
      :load-category-node="loadCategoryTreeNode"
      :submitting="submittingEditBook"
      @submit="submitEditBook"
  />
  <StockEntryDialog
      v-model:open="openEntryStepper"
      :publish-options="publishOptions"
      :category-tree-options="categoryTreeOptions"
      :category-tree-cache-data="categoryTreeCacheData"
      :load-category-node="loadCategoryTreeNode"
      @success="fetchData"
  />
  <StockDetailDialog v-model:open="open" v-model:stock="currentSelectedStock"/>
  <UCard class="flex h-full min-h-0 flex-col" :ui="{ body: 'flex-1 min-h-0' }">
    <template #header>
      <ActionGroup @flush="fetchData" :table="table">
        <UForm @submit.prevent="handleQuery" class="w-full">
          <div class="flex flex-wrap items-center gap-2">
            <USelect v-model="queryParams.field" defaultValue="name" :items="fieldItems" class="w-28"/>
            <UInput
                v-model="queryParams.keyword"
                icon="i-lucide-search"
                size="md"
                variant="outline"
                class="w-full sm:w-72"
                placeholder="请输入搜索内容..."
            />
            <UButton type="submit" icon="i-lucide-search" :loading="loadingPageData" label="搜索"/>
            <UButton
                type="button"
                variant="ghost"
                icon="i-lucide-rotate-ccw"
                :disabled="loadingPageData"
                label="重置"
                @click="resetQuery"
            />
          </div>
        </UForm>
        <template #behind>
          <UButton @click="openEntryModal" icon="i-lucide-plus" :loading="loadingOptions" variant="subtle" label="入库"/>
        </template>
      </ActionGroup>
    </template>
    <UTable
        class="h-full"
        ref="table"
        :columns="columns"
        :data="pageDate"
        :loading="loadingPageData"
        loading-color="primary"
        loading-animation="carousel"
        @select="showBookDetailInfo"
    />
    <template #footer>
      <div class="flex justify-center border-default pt-4">
        <UPagination v-model:page="queryParams.pageNum" :total="total"
                     :items-per-page="queryParams.pageSize" @update:page="fetchData"
        />
      </div>
    </template>
  </UCard>
</template>

<style scoped>

</style>
