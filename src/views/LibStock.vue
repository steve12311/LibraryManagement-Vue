<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, shallowRef, useTemplateRef, watch} from "vue";
import type {SelectItem, SelectMenuItem, TableColumn, TableRow} from "@nuxt/ui";
import moment from "moment";
import stockApi, {type StockForm, type StockPageVO, type StockQuery} from "@/api/library/stock-api.ts";
import bookApi, {type BookForm} from "@/api/library/book-api.ts";
import FileApi from "@/api/file-api.ts";
import categoryApi from "@/api/library/category-api.ts";
import publishApi from "@/api/library/publish-api.ts";
import {CalendarDate} from "@internationalized/date";
import StockOutDialog from "@/components/lib-stock/StockOutDialog.vue";
import EditBookDialog from "@/components/lib-stock/EditBookDialog.vue";
import StockDetailDialog from "@/components/lib-stock/StockDetailDialog.vue";
import StockEntryDialog from "@/components/lib-stock/StockEntryDialog.vue";

const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

onMounted(() => {
  void handleQuery()
})

const date = new Date()
const toast = useToast()
const pageDate = ref<StockPageVO[]>([])
const loadingPageData = ref(false)
const currentSelectedStock = ref<StockPageVO>()
const imageCache = new Map<string, string>()
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
const total = ref(0);
const open = ref(false)
const openEditBookDialog = ref(false)
const openStockOutDialog = ref(false)
const queryParams = reactive<StockQuery>({
  pageNum: 1,
  pageSize: 10,
  field: "name",
  keyword: void 0,
})
const table = useTemplateRef("table")
const publishOptions = ref<SelectMenuItem[]>([])
const categoryTreeOptions = ref<OptionType[]>([])
const loadingOptions = ref(false)
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
const stockOutIsbn = ref("")
const stockOutNumber = ref(0)
const stockOutMaxNumber = ref(0)
const submittingStockOut = ref(false)
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

// 查询（重置页码后获取数据）
async function handleQuery() {
  queryParams.pageNum = 1;
  await fetchData();
}

function normalizeKeyword(value?: string) {
  const keyword = String(value ?? "").trim()
  return keyword || void 0
}

function applySearchParams() {
  queryParams.keyword = normalizeKeyword(queryParams.keyword)
}

function resetQuery() {
  queryParams.field = "name"
  queryParams.keyword = void 0
  queryParams.pageNum = 1
  void fetchData()
}

function showBookDetailInfo(_: any, row: TableRow<StockPageVO>) {
  open.value = true
  currentSelectedStock.value = row.original
}

async function fetchData() {
  try {
    loadingPageData.value = true
    applySearchParams()
    const data = await stockApi.getPage(queryParams)
    total.value = data.total
    pageDate.value = data.list.map((item) => ({
      ...item,
      bookImage: fetchImage(item.bookImage),
    }))
  } catch (e) {
    console.error(e)
    pageDate.value = []
    total.value = 0
    toast.add({title: "错误", description: "库存数据加载失败", color: "error"})
  } finally {
    loadingPageData.value = false
  }
}

function fetchImage(originalUrl: string | undefined) {
  if (!originalUrl) {
    return void 0
  }
  const cachedUrl = imageCache.get(originalUrl)
  if (cachedUrl) {
    return cachedUrl
  }
  const resolvedUrl = FileApi.resolveUrl(originalUrl)
  if (!resolvedUrl) {
    return void 0
  }
  imageCache.set(originalUrl, resolvedUrl)
  return resolvedUrl
}

function toCalendarDate(value?: Date | string) {
  const target = value ? new Date(value) : new Date()
  return new CalendarDate(target.getFullYear(), target.getMonth() + 1, target.getDate())
}

function getCoverFileFromModel(model?: File): File | undefined {
  if (!model) return void 0
  const value = model as any
  if (value instanceof File) return value
  if (value?.file instanceof File) return value.file
  if (value?.raw instanceof File) return value.raw
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (first instanceof File) return first
    if (first?.file instanceof File) return first.file
    if (first?.raw instanceof File) return first.raw
  }
  return void 0
}

function resetEditBookForm() {
  editBookState.value = {...initialEditBookFormData}
  editBookCoverModel.value = void 0
  editBookPublishTime.value = toCalendarDate()
  submittingEditBook.value = false
  editingIsbn.value = ""
}

function resetStockOutForm() {
  stockOutIsbn.value = ""
  stockOutNumber.value = 0
  stockOutMaxNumber.value = 0
  submittingStockOut.value = false
}

watch(openEditBookDialog, (isOpen) => {
  if (!isOpen) {
    resetEditBookForm()
  }
})

watch(openStockOutDialog, (isOpen) => {
  if (!isOpen) {
    resetStockOutForm()
  }
})

async function fetchPublishOptions() {
  publishOptions.value = await publishApi.getOptions()
}

async function fetchCategoryOptions() {
  categoryTreeOptions.value = await categoryApi.getOptions()
}

async function fetchEntryOptions() {
  await Promise.all([fetchPublishOptions(), fetchCategoryOptions()])
}

async function openEntryModal() {
  loadingOptions.value = true
  try {
    await fetchEntryOptions()
    openEntryStepper.value = true
  } catch (error) {
    console.error(error)
    toast.add({title: "错误", description: "加载书籍选项失败", color: "error"})
  } finally {
    loadingOptions.value = false
  }
}

async function openEditBookModal(isbn: string) {
  if (!isbn) return
  editingIsbn.value = isbn
  loadingEditBook.value = true
  try {
    const [formData] = await Promise.all([
      bookApi.getFormData(isbn),
      fetchEntryOptions(),
    ])
    editBookState.value = {...formData}
    editBookPublishTime.value = toCalendarDate(formData.publishTime)
    editBookCoverModel.value = void 0
    openEditBookDialog.value = true
  } catch (error) {
    console.error(error)
    toast.add({title: "错误", description: "加载图书信息失败", color: "error"})
  } finally {
    loadingEditBook.value = false
  }
}

async function submitEditBook() {
  if (!editingIsbn.value) {
    toast.add({title: "错误", description: "ISBN不能为空", color: "error"})
    return
  }

  const payload: BookForm = {
    ...editBookState.value,
    isbn: editingIsbn.value,
    publishTime: new Date(editBookPublishTime.value.toString())
  }

  try {
    submittingEditBook.value = true
    const file = getCoverFileFromModel(editBookCoverModel.value)
    if (file) {
      const {url} = await FileApi.uploadFile(file)
      payload.cover = url
    }
    await bookApi.update(payload)
    toast.add({title: "成功", description: "修改成功", color: "success"})
    openEditBookDialog.value = false
    await fetchData()
  } catch (error) {
    console.error(error)
    toast.add({title: "错误", description: "修改图书失败", color: "error"})
  } finally {
    submittingEditBook.value = false
  }
}

function openStockOutModal(row: StockPageVO) {
  stockOutIsbn.value = row.isbn
  stockOutMaxNumber.value = Math.max(0, Number(row.currentNumber ?? 0))
  stockOutNumber.value = 0
  openStockOutDialog.value = true
}

async function submitStockOut() {
  if (!stockOutIsbn.value) {
    toast.add({title: "错误", description: "ISBN不能为空", color: "error"})
    return
  }
  if (stockOutNumber.value <= 0) {
    toast.add({title: "错误", description: "出库数量必须大于0", color: "error"})
    return
  }
  if (stockOutNumber.value > stockOutMaxNumber.value) {
    toast.add({title: "错误", description: "出库数量不能大于可用库存", color: "error"})
    return
  }

  try {
    submittingStockOut.value = true
    const formData = await stockApi.getFormData(stockOutIsbn.value)
    if (!formData) {
      toast.add({title: "错误", description: "未找到图书信息", color: "error"})
      return
    }

    const payload: StockForm = {
      ...formData,
      isbn: stockOutIsbn.value,
      stock: stockOutNumber.value,
    }
    await stockApi.update(payload)
    toast.add({title: "成功", description: "出库成功", color: "success"})
    openStockOutDialog.value = false
    await fetchData()
  } catch (error) {
    console.error(error)
    toast.add({title: "错误", description: "出库失败", color: "error"})
  } finally {
    submittingStockOut.value = false
  }
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
      :submitting="submittingEditBook"
      @submit="submitEditBook"
  />
  <StockEntryDialog
      v-model:open="openEntryStepper"
      :publish-options="publishOptions"
      :category-tree-options="categoryTreeOptions"
      @success="fetchData"
  />
  <StockDetailDialog v-model:open="open" v-model:stock="currentSelectedStock"/>
  <UCard>
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
    <UTable ref="table" :columns="columns" :data="pageDate" @select="showBookDetailInfo"/>
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
