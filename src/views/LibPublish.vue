<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, useTemplateRef} from "vue";
import type {SelectItem, TableColumn, TableRow} from "@nuxt/ui";
import moment from "moment/moment";
import publishApi, {type PublishForm, type PublishPageVO, type PublishQuery} from "@/api/publish-api.ts";
import * as v from 'valibot'

const UCheckbox = resolveComponent('UCheckbox')

onMounted(() => {
  handleQuery()
})

const pageDate = ref<PublishPageVO[]>([])
const toast = useToast()
const total = ref(0);
const open = ref(false)
const title = ref<string>("新增出版社")
const table = useTemplateRef("table")
const form = useTemplateRef("form")
const schema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("名称不可为空")),
})
const columns = ref<TableColumn<PublishPageVO>[]>([
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
const initialPublishFormData = ref<PublishForm>({
  id: undefined,
  name: "",
  country: "",
  province: "",
  city: "",
  area: "",
  areaDetail: "",
  postalCode: "",
  telephone: "",
  email: "",
})
const state = ref({...initialPublishFormData.value})
const emptyPublishFormData = ref({...initialPublishFormData.value})
const queryParams = reactive<PublishQuery>({
  pageNum: 1,
  pageSize: 10,
  field: "publishName"
})
const fieldItems = ref<SelectItem[]>([
  {
    label: "名称",
    value: "publishName"
  },
  {
    label: "地址",
    value: "address"
  }
])

function handleQuery() {
  queryParams.pageNum = 1
  fetchData()
}

async function fetchData() {
  try {
    const data = await publishApi.getPage(queryParams)
    pageDate.value = data.list
    total.value = data.total
  } catch (e) {
    console.log(e)
  }

}

function addPublish() {
  title.value = "新增出版社"
}

async function editPublish(id: number) {
  title.value = "修改出版社"
  const data = await publishApi.getFormData(id)
  initialPublishFormData.value = {...data};
  state.value = data;
}

async function openModal(type: "add" | "edit") {
  resetForm()
  if (type === "edit") {
    await editPublish(table.value!.tableApi.getSelectedRowModel().rows[0]!.original.publishId)
  } else {
    addPublish()
  }
  open.value = true
}

function selectHandle(_: Event, row: TableRow<PublishPageVO>) {
  row.toggleSelected(!row.getIsSelected())
}

function resetForm() {
  state.value = {...emptyPublishFormData.value}
}

function submitForm() {
  if (state.value.id) {
    publishApi.update(state.value).then(() => {
      resetForm()
      fetchData()
      toast.add({title: "成功", description: "修改成功", color: "success"})
    })
  } else {
    publishApi.create(state.value).then(() => {
      resetForm()
      fetchData()
      toast.add({title: "成功", description: "新增成功", color: "success"})
    })
  }
}

function deletePublish() {
  const ids = table.value!.tableApi.getSelectedRowModel().rows.map(row => row.original.publishId);
  publishApi.delete(ids).then(() => {
    fetchData()
    toast.add({title: "成功", description: "删除成功", color: "success"})
  })
}
</script>

<template>
  <UModal v-model:open="open" :title="title">
    <template #body>
      <UForm class="space-y-4" :schema="schema" :state="state" ref="form" @submit="submitForm">
        <UInput v-model="state.id" class="hidden"/>
        <div class="flex gap-2">
          <UFormField class="w-full" label="名称" name="name" required>
            <UInput class="w-full" v-model="state.name" placeholder="出版社名称"/>
          </UFormField>
          <UFormField class="w-full" label="联系电话" name="telephone">
            <UInput class="w-full" v-model="state.telephone" placeholder="联系电话"/>
          </UFormField>
        </div>
        <div class="flex gap-2">
          <UFormField class="w-full" label="电子邮箱" name="email">
            <UInput v-model="state.email" class="w-full" type="email" placeholder="电子邮箱"/>
          </UFormField>
          <UFormField class="w-full" label="邮编" name="postalCode">
            <UInput class="w-full" v-model="state.postalCode" placeholder="邮编"/>
          </UFormField>
        </div>
        <UFormField label="地址">
          <div class="flex gap-2">
            <UInput v-model="state.country" placeholder="国家"/>
            <UInput v-model="state.province" placeholder="省"/>
            <UInput v-model="state.city" placeholder="市"/>
            <UInput v-model="state.area" placeholder="区/县"/>
            <UInput v-model="state.areaDetail" placeholder="街道"/>
          </div>
        </UFormField>
      </UForm>
    </template>
    <template #footer>
      <div class="flex justify-end w-full gap-2">
        <UButton @click="form?.submit()" variant="subtle" color="error" label="确定"/>
        <UButton @click="open=false" variant="solid" label="取消"/>
      </div>
    </template>
  </UModal>
  <UCard>
    <template #header>
      <ActionGroup @flush="fetchData" :table="table">
        <UForm @submit="fetchData" class="w-full">
          <div class="flex gap-2">
            <USelect v-model="queryParams.field" defaultValue="name" :items="fieldItems" class="w-20"/>
            <UInput v-model="queryParams.keyword" icon="i-lucide-search" size="md" variant="outline"
                    placeholder="请输入搜索内容..."/>
          </div>
        </UForm>
        <UButton icon="i-lucide-plus" @click="openModal('add')" variant="subtle" label="新增"/>
        <UButton icon="i-lucide-clipboard-pen-line"
                 @click="openModal('edit')"
                 variant="subtle" label="修改"
                 :disabled="(table?.tableApi?.getFilteredSelectedRowModel().flatRows.length??0)!==1"
                 color="info"/>
        <UButton icon="i-lucide-trash-2" variant="subtle" @click="deletePublish"
                 :disabled="table?.tableApi?.getFilteredSelectedRowModel().flatRows.length===0"
                 label="删除" color="error"/>
      </ActionGroup>
    </template>
    <UTable ref="table" :data="pageDate" :columns="columns" @select="selectHandle"/>
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