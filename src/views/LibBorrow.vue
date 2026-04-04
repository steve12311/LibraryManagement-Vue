<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, shallowRef, useTemplateRef, watch} from "vue";
import type {InputMenuItem, SelectItem, SelectMenuItem, TableColumn} from "@nuxt/ui";
import moment from "moment";
import {CalendarDate} from "@internationalized/date";
import borrowApi, {
  type BorrowForm,
  type BorrowPageVO,
  type BorrowQuery
} from "@/api/library/borrow-api.ts";
import userApi from "@/api/system/user-api.ts";
import bookApi from "@/api/library/book-api.ts";
import * as v from "valibot";
import {ElMessageBox} from "element-plus";
import type { BorrowStatusFilterValue, BorrowStatusValue } from "@/enums/system/borrow-status-enum";
import {
  createBorrowStatusItems,
  getBorrowStatusColor,
  getBorrowStatusLabel,
  isBorrowReturned,
  resolveBorrowStatus
} from "@/utils/borrow-status";
import SystemPageHeader from "@/components/system/SystemPageHeader.vue";
import SystemQueryCard from "@/components/system/SystemQueryCard.vue";

const UAvatar = resolveComponent("UAvatar")
const UBadge = resolveComponent("UBadge")
const UButton = resolveComponent("UButton")
const UTooltip = resolveComponent("UTooltip")
const UFieldGroup = resolveComponent("UFieldGroup")

onMounted(() => {
  void handleQuery()
})

const toast = useToast()
const date = new Date()

const form = useTemplateRef("form")
const delayForm = useTemplateRef("delayForm")
const table = useTemplateRef("table")
const inputDate = useTemplateRef("inputDate")

const pageData = shallowRef<BorrowPageVO[]>([])
const total = ref(0)
const open = ref(false)
const openConfirm = ref(false)
const loadingPageData = ref(false)
const loadingBorrowOptions = ref(false)
const submittingBorrow = ref(false)
const submittingDelay = ref(false)
const returningBorrowId = ref("")

const queryParams = reactive<BorrowQuery>({
  pageNum: 1,
  pageSize: 10,
  field: "isbn",
  keyword: void 0,
})
const searchForm = reactive({
  field: "isbn" as BorrowQuery["field"],
  keyword: "",
  status: -1 as BorrowStatusFilterValue,
})

const userOptions = ref<SelectMenuItem[]>([])
const bookOptions = ref<InputMenuItem[]>([])
const fieldItems = ref<SelectItem[]>([
  {
    label: "用户名",
    value: "username"
  },
  {
    label: "ISBN",
    value: "isbn"
  },
  {
    label: "状态",
    value: "status"
  }
])
const statusItems = ref<SelectItem[]>(createBorrowStatusItems(true))

const delayDay = ref(1)
const selectedDelayBorrowId = ref("")
const selectedDelayReturnTime = ref<Date | null>(null)
const returnTime = shallowRef(new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()))
const initialBorrowFormData: BorrowForm = {
  isbn: "",
  userId: "",
  returnTime: new Date()
}
const state = ref<BorrowForm>({...initialBorrowFormData})
const schema = v.object({
  isbn: v.union([
    v.pipe(v.string(), v.nonEmpty("ISBN不能为空")),
    v.number("ISBN不能为空"),
  ]),
  userId: v.union([
    v.pipe(v.string(), v.nonEmpty("借阅用户不能为空")),
    v.number("借阅用户不能为空"),
  ]),
})

const columns = ref<TableColumn<BorrowPageVO>[]>([
  {
    accessorKey: "borrowId",
    header: "借阅订单"
  },
  {
    accessorKey: "isbn",
    header: "ISBN"
  },
  {
    accessorKey: "bookName",
    header: "名称"
  },
  {
    id: "userInfo",
    header: "借阅用户",
    cell: ({row}) => {
      return h("div", {class: "flex items-center gap-3"}, [
        h(UAvatar, {
          size: "lg",
          src: row.original.avatar
        }),
        h("div", undefined, [
          h("p", {class: "font-medium text-highlighted"}, row.original.nickname),
          h("p", undefined, `@${row.original.username}`)
        ])
      ])
    }
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
      const status = getRowBorrowStatus(row.original)
      return h(UBadge, {
        class: "capitalize",
        variant: "subtle",
        color: getBorrowStatusColor(status)
      }, () => getBorrowStatusLabel(status))
    },
  },
  {
    id: "action",
    header: "操作",
    cell: ({row}) => {
      if (isBorrowReturned(getRowBorrowStatus(row.original))) {
        return
      }
      return h(UFieldGroup, undefined, () => [
        h(UTooltip, {text: "延长时间", delayDuration: 0}, () => [
          h(UButton, {
            icon: "i-lucide-calendar-clock",
            variant: "ghost",
            onClick: (ev: Event) => {
              ev.stopPropagation()
              openDelayModal(row.original)
            }
          }, [])
        ]),
        h(UTooltip, {text: "归还图书", delayDuration: 0}, () => [
          h(UButton, {
            icon: "i-lucide-book-down",
            variant: "ghost",
            loading: returningBorrowId.value === row.original.borrowId,
            onClick: (ev: Event) => {
              ev.stopPropagation()
              void confirmReturnBorrow(row.original.borrowId)
            }
          }),
        ]),
      ])
    }
  }
])

watch(open, (isOpen) => {
  if (!isOpen) {
    resetBorrowForm()
  }
})

watch(openConfirm, (isOpen) => {
  if (!isOpen) {
    resetDelayForm()
  }
})

watch(() => searchForm.field, (field) => {
  if (field === "status") {
    searchForm.keyword = ""
    return
  }
  searchForm.status = -1
})

function toCalendarDate(value?: Date | string | null) {
  const target = value ? new Date(value) : new Date()
  return new CalendarDate(target.getFullYear(), target.getMonth() + 1, target.getDate())
}

function parseDate(value?: Date | string | null) {
  if (!value) return null
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null
  return target
}

function getRowBorrowStatus(row: BorrowPageVO): BorrowStatusValue {
  return resolveBorrowStatus(row.returnTime, row.realityReturnTime)
}

function applySearchParams() {
  queryParams.field = searchForm.field
  if (searchForm.field === "status") {
    queryParams.keyword = searchForm.status === -1 ? void 0 : searchForm.status
    return
  }
  const keyword = searchForm.keyword.trim()
  queryParams.keyword = keyword || void 0
}

async function handleQuery() {
  applySearchParams()
  queryParams.pageNum = 1
  await fetchData()
}

function resetQuery() {
  searchForm.field = "isbn"
  searchForm.keyword = ""
  searchForm.status = -1
  void handleQuery()
}

async function fetchData() {
  try {
    loadingPageData.value = true
    const data = await borrowApi.getPage(queryParams)
    pageData.value = data.list
    total.value = data.total
  } catch (error) {
    console.error(error)
    pageData.value = []
    total.value = 0
    toast.add({title: "错误", description: "借阅数据加载失败", color: "error"})
  } finally {
    loadingPageData.value = false
  }
}

async function fetchUserOptions() {
  userOptions.value = await userApi.getOptions()
}

async function fetchBookOptions() {
  bookOptions.value = await bookApi.getOptions()
}

async function openModal() {
  loadingBorrowOptions.value = true
  try {
    await Promise.all([fetchUserOptions(), fetchBookOptions()])
    open.value = true
  } catch (error) {
    console.error(error)
    toast.add({title: "错误", description: "借阅表单选项加载失败", color: "error"})
  } finally {
    loadingBorrowOptions.value = false
  }
}

function resetBorrowForm() {
  state.value = {...initialBorrowFormData}
  returnTime.value = toCalendarDate()
  submittingBorrow.value = false
}

function openDelayModal(row: BorrowPageVO) {
  selectedDelayBorrowId.value = row.borrowId
  selectedDelayReturnTime.value = parseDate(row.returnTime) ?? new Date()
  delayDay.value = 1
  openConfirm.value = true
}

function resetDelayForm() {
  delayDay.value = 1
  selectedDelayBorrowId.value = ""
  selectedDelayReturnTime.value = null
  submittingDelay.value = false
}

async function submitForm() {
  const isbn = String(state.value.isbn ?? "").trim()
  if (!isbn) {
    toast.add({title: "错误", description: "ISBN不能为空", color: "error"})
    return
  }
  const userIdNumber = Number(state.value.userId ?? "")
  if (!Number.isFinite(userIdNumber) || userIdNumber <= 0) {
    toast.add({title: "错误", description: "借阅用户无效", color: "error"})
    return
  }
  const payload: BorrowForm = {
    ...state.value,
    isbn,
    userId: userIdNumber,
    returnTime: new Date(returnTime.value.toString()),
  }
  try {
    submittingBorrow.value = true
    await borrowApi.create(payload)
    toast.add({title: "成功", description: "新增成功", color: "success"})
    open.value = false
    await fetchData()
  } catch (error) {
    console.error(error)
    toast.add({title: "错误", description: "新增借阅失败", color: "error"})
  } finally {
    submittingBorrow.value = false
  }
}

async function submitDelayDay() {
  if (!selectedDelayBorrowId.value) {
    toast.add({title: "错误", description: "借阅单不存在", color: "error"})
    return
  }
  if (delayDay.value <= 0) {
    toast.add({title: "错误", description: "延期天数必须大于0", color: "error"})
    return
  }
  const baseDate = selectedDelayReturnTime.value ?? new Date()
  const nextDate = new Date(baseDate)
  nextDate.setDate(nextDate.getDate() + delayDay.value)
  try {
    submittingDelay.value = true
    await borrowApi.update(selectedDelayBorrowId.value, {returnTime: nextDate})
    toast.add({title: "成功", description: "延期成功", color: "success"})
    openConfirm.value = false
    await fetchData()
  } catch (error) {
    console.error(error)
    toast.add({title: "错误", description: "延期失败", color: "error"})
  } finally {
    submittingDelay.value = false
  }
}

async function confirmReturnBorrow(borrowId: string) {
  try {
    await ElMessageBox.confirm("还书后不可撤销", "确认还书吗？")
  } catch {
    return
  }
  try {
    returningBorrowId.value = borrowId
    await borrowApi.update(borrowId, {realityReturnTime: new Date()})
    toast.add({title: "成功", description: "还书成功", color: "success"})
    await fetchData()
  } catch (error) {
    console.error(error)
    toast.add({title: "错误", description: "还书失败", color: "error"})
  } finally {
    returningBorrowId.value = ""
  }
}
</script>

<template>
  <UModal
      v-model:open="openConfirm"
      title="延期还书"
      :ui="{ content: 'sm:max-w-lg rounded-[28px] border-0 bg-white shadow-[var(--library-shadow)]' }"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">延期归还</p>
        <p class="system-modal-description">在当前预计归还日期基础上顺延借阅时间。</p>
      </div>
      <UForm @submit.prevent="submitDelayDay" ref="delayForm" class="mt-5 space-y-3">
        <UFormField label="延期天数">
          <UInputNumber v-model="delayDay" :min="1" class="w-full"/>
        </UFormField>
        <p class="text-xs text-muted">
          将在当前预计归还日期基础上顺延。
        </p>
      </UForm>
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton @click="openConfirm = false" variant="ghost" label="取消"/>
        <UButton @click="delayForm?.submit()" :loading="submittingDelay" variant="subtle" color="error" label="确定"/>
      </div>
    </template>
  </UModal>
  <UModal
      v-model:open="open"
      title="新增借阅"
      :ui="{ content: 'sm:max-w-2xl rounded-[28px] border-0 bg-white shadow-[var(--library-shadow)]' }"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">创建借阅单</p>
        <p class="system-modal-description">选择图书、借阅用户和预计归还日期，创建新的借阅记录。</p>
      </div>
      <UForm @submit.prevent="submitForm" :schema="schema" :state="state" ref="form" class="mt-5 gap-y-4">
        <UFormField name="isbn" class="w-full" label="ISBN" required>
          <UInputMenu valueKey="value" v-model="state.isbn" virtualize icon="i-lucide-book" class="w-full"
                      :items="bookOptions"
                      :loading="loadingBorrowOptions"
                      :ui="{ content: 'min-w-fit' }" required/>
        </UFormField>
        <UFieldGroup class="w-full gap-2">
          <UFormField name="userId" class="w-full" label="借阅用户" required>
            <USelectMenu valueKey="value" v-model="state.userId" virtualize icon="i-lucide-user" class="w-full"
                         :items="userOptions"
                         :loading="loadingBorrowOptions"
                         :ui="{ content: 'min-w-fit' }" required/>
          </UFormField>
          <UFormField class="w-full" label="归还日期">
            <UInputDate class="w-full" ref="inputDate" v-model="returnTime">
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
                    <UCalendar v-model="returnTime" class="p-2"/>
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </UFormField>
        </UFieldGroup>
      </UForm>
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton @click="open = false" variant="ghost" label="取消"/>
        <UButton @click="form?.submit()" :loading="submittingBorrow" variant="subtle" color="error" label="确定"/>
      </div>
    </template>
  </UModal>
  <UCard
      class="system-page-card flex h-full min-h-0 flex-col"
      :ui="{ header: 'p-5 pb-0', body: 'flex-1 min-h-0 p-5 pt-0', footer: 'px-5 pb-5 pt-3' }"
  >
    <template #header>
      <SystemPageHeader
          kicker="BORROWING RECORDS"
          title="借阅管理"
          description="统一处理借阅查询、新增借阅、延期归还与还书流转。"
          :stats="[
            { label: '借阅记录', value: total },
            { label: '当前页', value: queryParams.pageNum },
            { label: '当前模式', value: searchForm.field === 'status' ? '状态' : '关键词' }
          ]"
      />

      <SystemQueryCard>
        <template #actions>
          <ActionGroup :table="table" @flush="fetchData">
            <template #behind>
              <UButton @click="openModal" :loading="loadingBorrowOptions" icon="i-lucide-plus" variant="subtle" label="新增"/>
            </template>
          </ActionGroup>
        </template>
        <UForm @submit.prevent="handleQuery" class="w-full">
          <div class="system-query-row">
            <USelect v-model="searchForm.field" defaultValue="isbn" :items="fieldItems" class="w-28"/>
            <USelect v-if="searchForm.field === 'status'" v-model="searchForm.status" class="w-32" :items="statusItems"/>
            <UInput
                v-else
                v-model="searchForm.keyword"
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
      </SystemQueryCard>
    </template>
    <div class="system-table-card">
      <UTable
          class="h-full"
          ref="table"
          :data="pageData"
          :columns="columns"
          :loading="loadingPageData"
          loading-color="primary"
          loading-animation="carousel"
      />
    </div>
    <template #footer>
      <div class="system-page-footer">
        <p class="system-page-summary">当前共 {{ total }} 条借阅记录</p>
        <UPagination v-model:page="queryParams.pageNum" :total="total"
                     :items-per-page="queryParams.pageSize" @update:page="fetchData"/>
      </div>
    </template>
  </UCard>
</template>
