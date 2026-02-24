<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, shallowRef, useTemplateRef} from "vue";
import type {InputMenuItem, SelectItem, SelectMenuItem, TableColumn} from "@nuxt/ui";
import moment from "moment";
import {CalendarDate} from '@internationalized/date'
import borrowApi, {type BorrowForm, type BorrowPageVO, type BorrowQuery} from "@/api/borrow-api.ts";
import userApi from "@/api/user-api.ts";
import bookApi from "@/api/book-api.ts";
import * as v from 'valibot'
import {ElMessageBox} from "element-plus";

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
const UFieldGroup = resolveComponent('UFieldGroup')

onMounted(() => {
  handleQuery()
})

const toast = useToast()
const date = new Date()
const form = useTemplateRef("form")
const pageData = ref<BorrowPageVO[]>([])
const table = useTemplateRef("table")
const inputDate = useTemplateRef('inputDate')
const queryParams = reactive<BorrowQuery>({
  pageNum: 1,
  pageSize: 10,
  field: "isbn"
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
const statusItems = ref<SelectItem[]>([
  {
    label: "全部",
    value: null
  },
  {
    label: "已归还",
    value: 0
  },
  {
    label: "借阅中",
    value: 1
  },
  {
    label: "已逾期",
    value: 2
  }
])
const total = ref(0);
const open = ref(false)
const openConfirm = ref(false)
const delayDay = ref(0)
const delayForm = useTemplateRef("delayForm")
const returnTime = shallowRef(new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()))
const clickUUID = ref("")
const initialBorrowFormData = ref<BorrowForm>({
  isbn: "",
  userId: "",
  returnTime: new Date()
})
const emptyBorrowFormData = ref({...initialBorrowFormData.value})
const state = ref({...initialBorrowFormData.value})
const schema = v.object({
  isbn: v.pipe(v.string(), v.nonEmpty("ISBN不能为空")),
  userId: v.pipe(v.string(), v.nonEmpty("借阅用户不能为空")),
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
      return h('div', {class: 'flex items-center gap-3'}, [
        h(UAvatar, {
          size: "lg",
          src: row.original.avatar
        }),
        h("div", undefined, [
          h('p', {class: 'font-medium text-highlighted'}, row.original.nickname),
          h('p', {class: ''}, `@${row.original.username}`)
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
      return h(UBadge, {
            class: 'capitalize',
            variant: 'subtle',
            color: getBorrowStatus(row.original)
          }, () =>
              getBorrowText(row.original)
      )
    },
  },
  {
    id: "action",
    header: "操作",
    cell: ({row}) => {
      if (!row.original.realityReturnTime) {
        return h(UFieldGroup, undefined, () => [
          h(UTooltip, {text: "延长时间", delayDuration: 0}, () => [
            h(UButton, {
              icon: "i-lucide-calendar-clock", variant: "ghost", onClick: () => {
                openConfirm.value = true
                clickUUID.value = row.original.borrowId
              }
            }, [])
          ]),
          h(UTooltip, {text: "归还图书", delayDuration: 0}, () => [
            h(UButton, {
              icon: "i-lucide-book-down", variant: "ghost", onClick: () => {
                ElMessageBox.confirm("还书后不可撤销", "确认还书吗？")
                    .then(() => {
                      borrowApi.update(row.original.borrowId, {
                        realityReturnTime: new Date()
                      }).then(() => {
                        fetchData()
                      })
                    })
              }
            }),
          ]),
        ])
      }
    }
  }
])

function getBorrowText(row: BorrowPageVO) {
  const returnTime = new Date(moment(row.returnTime).format('YYYY-MM-DD'))
  if (row.realityReturnTime === null) {
    if (returnTime < new Date()) {
      return "已逾期"
    }
    return "借阅中"
  } else {
    return "已归还"
  }
}

function getBorrowStatus(row: BorrowPageVO) {
  const returnTime = new Date(moment(row.returnTime).format('YYYY-MM-DD'))
  if (row.realityReturnTime === null) {
    if (returnTime < new Date()) {
      return "error"
    }
    return "success"
  } else {
    return "neutral"
  }
}

function handleQuery() {
  queryParams.pageNum = 1;
  fetchData()
}

async function fetchData() {
  try {
    const data = await borrowApi.getPage(queryParams)
    pageData.value = data.list
    total.value = data.total
  } catch (e) {
    console.log(e)
  }
}

async function fetchUserOptions() {
  try {
    userOptions.value = await userApi.getOptions()
  } catch (e) {
    console.log(e)
  }
}

async function fetchBookOptions() {
  try {
    bookOptions.value = await bookApi.getOptions()
  } catch (e) {
    console.log(e)
  }
}

async function openModal() {
  await fetchUserOptions()
  await fetchBookOptions()
  open.value = true
}

function resetForm() {
  state.value = {...emptyBorrowFormData.value}
}

function submitForm() {
  state.value.returnTime = new Date(returnTime.value.toString())
  borrowApi.create(state.value)
      .then(() => {
        resetForm()
        toast.add({title: "成功", description: "新增成功", color: "success"})
        fetchData()
      })
}

function submitDelayDay() {
  const day = new Date()
  day.setDate(day.getDate() + delayDay.value)
  borrowApi.update(clickUUID.value, {
    returnTime: day
  }).then(() => {
    toast.add({title: "成功", description: "延期成功", color: "success"})
    openConfirm.value = false
    fetchData()
  })
}
</script>

<template>
  <UModal v-model:open="openConfirm" title="延迟还书">
    <template #body>
      <UForm @submit="submitDelayDay" ref="delayForm">
        <UInputNumber v-model="delayDay" :min="0"/>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end w-full gap-2">
        <UButton @click="delayForm?.submit()" variant="subtle" color="error" label="确定"/>
        <UButton variant="solid" label="取消"/>
      </div>
    </template>
  </UModal>
  <UModal v-model:open="open" title="新增借阅">
    <template #body>
      <UForm @submit="submitForm" :schema="schema" :state="state" ref="form" class="gap-y-4">
        <UFormField name="isbn" class="w-full" label="ISBN" required>
          <UInputMenu valueKey="value" v-model="state.isbn" virtualize icon="i-lucide-book" class="w-full"
                      :items="bookOptions"
                      :ui="{ content: 'min-w-fit' }" required/>
        </UFormField>
        <UFieldGroup class="w-full gap-2">
          <UFormField name="userId" class="w-full" label="借阅用户" required>
            <USelectMenu valueKey="value" v-model="state.userId" virtualize icon="i-lucide-user" class="w-full"
                         :items="userOptions"
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
      <div class="flex justify-end w-full gap-2">
        <UButton @click="form?.submit()" variant="subtle" color="error" label="确定"/>
        <UButton variant="solid" label="取消"/>
      </div>
    </template>
  </UModal>
  <UCard>
    <template #header>
      <ActionGroup :table="table" @flush="fetchData">
        <UForm @submit="fetchData" class="w-full">
          <div class="flex gap-2">
            <USelect v-model="queryParams.field" defaultValue="name" :items="fieldItems" class="w-25"/>
            <USelect @change="fetchData" v-model="queryParams.keyword" class="w-40" :items="statusItems"
                     v-if="queryParams.field === 'status'"/>
            <UInput v-else v-model="queryParams.keyword" icon="i-lucide-search" size="md" variant="outline"
                    placeholder="请输入搜索内容..."/>
          </div>
        </UForm>
        <UButton @click="openModal" icon="i-lucide-plus" variant="subtle" label="新增"/>
      </ActionGroup>
    </template>
    <UTable ref="table" :data="pageData" :columns="columns"/>
    <template #footer>
      <div class="flex justify-center border-default pt-4">
        <UPagination v-model:page="queryParams.pageNum" :total="total"
                     :items-per-page="queryParams.pageSize" @update:page="fetchData"/>
      </div>
    </template>
  </UCard>
</template>

<style scoped>

</style>