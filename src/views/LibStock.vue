<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, shallowRef, useTemplateRef, watch} from "vue";
import type {SelectItem, SelectMenuItem, StepperItem, TableColumn, TableRow} from "@nuxt/ui";
import moment from "moment/moment";
import stockApi, {type StockForm, type StockPageVO, type StockQuery} from "@/api/stock-api.ts";
import bookApi, {type BookForm} from "@/api/book-api.ts";
import FileApi from "@/api/file-api.ts";
import categoryApi from "@/api/category-api.ts";
import publishApi from "@/api/publish-api.ts";
import {ElDialog, ElTreeSelect} from "element-plus";
import {CalendarDate} from "@internationalized/date";
import StockOutDialog from "@/components/lib-stock/StockOutDialog.vue";
import EditBookDialog from "@/components/lib-stock/EditBookDialog.vue";
import StockDetailDialog from "@/components/lib-stock/StockDetailDialog.vue";

const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

onMounted(() => {
  handleQuery()
})

const date = new Date()
const toast = useToast()
const pageDate = ref<StockPageVO[]>([])
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
const total = ref(0);
const open = ref(false)
const openEditBookDialog = ref(false)
const openStockOutDialog = ref(false)
const queryParams = reactive<StockQuery>({
  pageNum: 1,
  pageSize: 10,
  field: "name"
})
const table = useTemplateRef("table")
const publishOptions = ref<SelectMenuItem[]>([])
const categoryTreeOptions = ref<OptionType[]>([])
const loadingOptions = ref(false)
const columns = ref<TableColumn<any>[]>([
  {
    id: "bookImage",
    accessorKey: "bookImage",
    header: "封面",
    cell: ({row}) => {
      return h("div", {
        style: {
          height: "120px",
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
    cell: ({row}) => h('div', undefined, [
      h(UTooltip, {text: "修改", delayDuration: 0}, () => [
        h(UButton, {
          icon: "i-lucide-clipboard-pen-line",
          variant: "ghost",
          loading: loadingEditBook.value,
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
            openStockOutModal(row.original.isbn)
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
const submittingStockOut = ref(false)
const openEntryStepper = ref(false)
const isbnExists = ref(false)
const checkingISBN = ref(false)
const submittingStock = ref(false)
const entryStepper = useTemplateRef("entryStepper")
const entryStepperItems = ref<StepperItem[]>([
  {
    title: "ISBN",
  },
  {
    title: "书籍详情",
  },
  {
    title: "检查"
  }
])
const initialStockFormData: StockForm = {
  author: "",
  categoryId: void 0,
  cover: void 0,
  intro: "",
  isbn: "",
  name: "",
  pressId: void 0,
  price: 0,
  publishTime: date,
  stock: 0
}
const state = ref<StockForm>({...initialStockFormData})
const coverModel = ref<File>()
const inputDate = useTemplateRef("inputDate")
const publishTime = shallowRef(new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()))
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
function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}

function showBookDetailInfo(_: any, row: TableRow<StockPageVO>) {
  open.value = true
  currentSelectedStock.value = row.original
}

async function fetchData() {
  try {
    const data = await stockApi.getPage(queryParams)
    pageDate.value = data.list
    total.value = data.total
    for (const item of pageDate.value) {
      item.bookImage = await fetchImage(item.bookImage)
    }
  } catch (e) {
    console.log(e)
  }
}

async function fetchImage(originalUrl: string | undefined) {
  if (originalUrl) {
    const blob = await FileApi.getFile(originalUrl)
    return URL.createObjectURL(blob.data)
  }
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

function getCoverFile(): File | undefined {
  return getCoverFileFromModel(coverModel.value)
}

function resetEntryForm() {
  state.value = {...initialStockFormData}
  coverModel.value = void 0
  isbnExists.value = false
  checkingISBN.value = false
  submittingStock.value = false
  publishTime.value = toCalendarDate()
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
  submittingStockOut.value = false
}

watch(openEntryStepper, (isOpen) => {
  if (isOpen) {
    resetEntryForm()
  }
})

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
  try {
    publishOptions.value = await publishApi.getOptions()
  } catch (e) {
    console.log(e)
  }
}

async function fetchCategoryOptions() {
  try {
    categoryTreeOptions.value = await categoryApi.getOptions()
  } catch (e) {
    console.log(e)
  }
}

async function openEntryModal() {
  loadingOptions.value = true
  try {
    await Promise.all([fetchPublishOptions(), fetchCategoryOptions()])
    openEntryStepper.value = true
  } finally {
    loadingOptions.value = false
  }
}

async function openEditBookModal(isbn: string) {
  if (!isbn) return
  loadingEditBook.value = true
  try {
    const [_, __, formData] = await Promise.all([
      fetchPublishOptions(),
      fetchCategoryOptions(),
      bookApi.getFormData(isbn)
    ])
    editingIsbn.value = isbn
    editBookState.value = {...formData}
    editBookPublishTime.value = toCalendarDate(formData.publishTime)
    editBookCoverModel.value = void 0
    openEditBookDialog.value = true
  } catch (e) {
    console.log(e)
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
  } catch (e) {
    console.log(e)
  } finally {
    submittingEditBook.value = false
  }
}

function openStockOutModal(isbn: string) {
  stockOutIsbn.value = isbn
  stockOutNumber.value = 0
  openStockOutDialog.value = true
}

async function submitStockOut() {
  if (!stockOutIsbn.value) {
    toast.add({title: "错误", description: "ISBN不能为空", color: "error"})
    return
  }
  if (stockOutNumber.value < 0) {
    toast.add({title: "错误", description: "出库数量不能小于0", color: "error"})
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
  } catch (e) {
    console.log(e)
  } finally {
    submittingStockOut.value = false
  }
}

async function nextEntryStep() {
  if (!entryStepper.value?.hasNext) return

  if (!entryStepper.value.hasPrev) {
    const isbn = state.value.isbn.trim()
    if (!isbn) {
      toast.add({title: "错误", description: "ISBN不能为空", color: "error"})
      return
    }

    checkingISBN.value = true
    try {
      const formData = await stockApi.getFormData(isbn)
      isbnExists.value = !!formData
      state.value = {
        ...state.value,
        stock: 0
      }
      publishTime.value = toCalendarDate(formData?.publishTime)
      coverModel.value = void 0
      entryStepper.value.next()
    } catch (e) {
      console.log(e)
    } finally {
      checkingISBN.value = false
    }
    return
  }

  entryStepper.value.next()
}

async function submitStock() {
  const isbn = state.value.isbn.trim()
  if (!isbn) {
    toast.add({title: "错误", description: "ISBN不能为空", color: "error"})
    return
  }

  if (state.value.stock <= 0) {
    toast.add({title: "错误", description: "入库数量必须大于0", color: "error"})
    return
  }

  const payload: StockForm = {
    ...state.value,
    isbn,
    publishTime: new Date(publishTime.value.toString())
  }

  try {
    submittingStock.value = true
    if (!isbnExists.value) {
      const file = getCoverFile()
      if (file) {
        const {url} = await FileApi.uploadFile(file)
        payload.cover = url
      }
    }
    await stockApi.create(payload)
    toast.add({title: "成功", description: "入库成功", color: "success"})
    openEntryStepper.value = false
    await fetchData()
  } catch (e) {
    console.log(e)
  } finally {
    submittingStock.value = false
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
  <ElDialog v-model="openEntryStepper" title="图书入库" align-center>
    <div class="w-full" style="max-height: 70vh;overflow-y: scroll;overflow-x: hidden">
      <UStepper disabled ref="entryStepper" :items="entryStepperItems">
        <template #content="{ item }">
          <div class="w-full">
            <UForm :state="state" class="flex flex-col gap-y-4">
              <UFormField class="w-full" label="ISBN" required>
                <UInput v-model="state.isbn" class="w-full" required :disabled="entryStepper?.hasPrev"/>
              </UFormField>
              <template v-if="item.title !== 'ISBN'">
                <template v-if="isbnExists">
                  <UAlert
                      color="warning"
                      variant="soft"
                      title="已存在该 ISBN，只允许录入入库数量"
                  />
                  <UFormField class="w-full" label="数量">
                    <UInputNumber v-model="state.stock" :min="0" class="w-full"/>
                  </UFormField>
                </template>
                <template v-else>
                  <UFormField class="w-full" label="出版日期">
                    <UInputDate class="w-full" ref="inputDate" v-model="publishTime">
                      <template #trailing>
                        <UPopover :reference="inputDate?.inputsRef[3]?.$el">
                          <UButton
                              color="neutral"
                              variant="link"
                              size="sm"
                              icon="i-lucide-calendar"
                              aria-label="Select a date"
                              class="px-0"
                          />

                          <template #content>
                            <UCalendar v-model="publishTime" class="p-2"/>
                          </template>
                        </UPopover>
                      </template>
                    </UInputDate>
                  </UFormField>
                  <UFormField class="w-full" label="封面">
                    <UFileUpload
                        v-model="coverModel"
                        accept="image/*"
                        label="上传图片拖到此处"
                        description="SVG, PNG, JPG or GIF (最大支持2MB)"
                        class="w-full min-h-48"
                    />
                  </UFormField>
                  <UFieldGroup class="w-full gap-2">
                    <UFormField class="w-full" label="名称">
                      <UInput v-model="state.name" class="w-full"/>
                    </UFormField>
                    <UFormField class="w-full" label="作者">
                      <UInput v-model="state.author" class="w-full"/>
                    </UFormField>
                  </UFieldGroup>
                  <UFieldGroup class="w-full gap-2">
                    <UFormField class="w-full" label="出版社">
                      <USelect v-model="state.pressId" class="w-full" :items="publishOptions"/>
                    </UFormField>
                    <UFormField class="w-full" label="数量">
                      <UInputNumber v-model="state.stock" :min="0" class="w-full"/>
                    </UFormField>
                  </UFieldGroup>
                  <UFieldGroup class="w-full gap-2">
                    <UFormField class="w-full" label="价格">
                      <UInputNumber v-model="state.price" :formatOptions="{
                      style: 'currency',
                      currency: 'CNY',
                      currencyDisplay: 'code',
                      currencySign: 'accounting'
                    }" :min="0" :step="0.01" class="w-full"/>
                    </UFormField>
                    <UFormField class="w-full" label="分类">
                      <ElTreeSelect
                          v-model="state.categoryId"
                          :data="categoryTreeOptions"
                          :check-strictly="true"
                          :render-after-expand="false"
                          placeholder="选择分类"
                          class="w-full"
                      />
                    </UFormField>
                  </UFieldGroup>
                  <UFormField class="w-full" label="简介">
                    <UTextarea v-model="state.intro" class="w-full" :rows="12"/>
                  </UFormField>
                </template>
              </template>
            </UForm>
          </div>
        </template>
      </UStepper>
    </div>
    <template #footer>
      <div class="w-full flex gap-2 justify-between mt-4">
        <UButton
            leading-icon="i-lucide-arrow-left"
            :disabled="!entryStepper?.hasPrev"
            @click="entryStepper?.prev()"
            label="上一步"
        />
        <template v-if="entryStepper?.hasNext">
          <UButton
              trailing-icon="i-lucide-arrow-right"
              :disabled="!entryStepper?.hasNext || checkingISBN"
              :loading="checkingISBN"
              @click="nextEntryStep"
              label="下一步"
          />
        </template>
        <template v-else>
          <UButton label="完成" :loading="submittingStock" @click="submitStock"/>
        </template>
      </div>
    </template>
  </ElDialog>
  <StockDetailDialog v-model:open="open" v-model:stock="currentSelectedStock"/>
  <UCard>
    <template #header>
      <ActionGroup @flush="fetchData" :table="table">
        <UForm @submit="fetchData" class="w-full">
          <div class="flex gap-2">
            <USelect v-model="queryParams.field" defaultValue="name" :items="fieldItems" class="w-48"/>
            <UInput v-model="queryParams.keyword" icon="i-lucide-search" size="md" variant="outline"
                    placeholder="请输入搜索内容..."/>
          </div>
        </UForm>
        <template #behind>
          <UButton @click="openEntryModal" :loading="loadingOptions" label="入库"/>
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
