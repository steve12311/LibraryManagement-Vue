<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, shallowRef, useTemplateRef, watch} from "vue";
import type {SelectItem, TableColumn} from "@nuxt/ui";
import moment from "moment";
import {ElMessageBox} from "element-plus";
import publishApi, {
  type PublishForm,
  type PublishId,
  type PublishPageVO,
  type PublishQuery
} from "@/api/library/publish-api.ts";
import * as v from "valibot";

const UCheckbox = resolveComponent("UCheckbox")

onMounted(() => {
  void handleQuery()
})

const toast = useToast()
const table = useTemplateRef("table")
const form = useTemplateRef("form")

const pageData = shallowRef<PublishPageVO[]>([])
const total = ref(0)
const open = ref(false)
const editModalMode = ref<"add" | "edit">("add")
const editModalTitle = ref("新增出版社")
const loadingPageData = ref(false)
const loadingEditPublish = ref(false)
const submittingPublish = ref(false)
const deletingPublish = ref(false)
const editingPublishId = ref<PublishId | undefined>(void 0)
const columnVisibility = ref({
  publishId: false
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
const queryParams = reactive<PublishQuery>({
  pageNum: 1,
  pageSize: 10,
  field: "publishName",
  keyword: void 0
})
const searchForm = reactive({
  field: "publishName" as PublishQuery["field"],
  keyword: "",
})

const schema = v.object({
  name: v.pipe(v.string(), v.nonEmpty("名称不可为空")),
})
const initialPublishFormData: PublishForm = {
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
}
const state = ref<PublishForm>(createPublishForm())

const columns = ref<TableColumn<PublishPageVO>[]>([
  {
    id: "select",
    header: ({table}) => {
      return h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
            ? "indeterminate"
            : table.getIsAllPageRowsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") => table.toggleAllPageRowsSelected(!!value),
        "aria-label": "选择全部"
      })
    },
    cell: ({row}) => {
      return h(UCheckbox, {
        modelValue: row.getIsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") => row.toggleSelected(!!value),
        "aria-label": "选择单行"
      })
    }
  },
  {
    accessorKey: "publishId",
    header: "ID"
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
    cell: ({row}) => formatDateTime(row.original.createTime),
  }
])

watch(open, (isOpen) => {
  if (!isOpen) {
    resetForm()
  }
})

function normalizeText(value?: string) {
  return String(value ?? "").trim()
}

function formatDateTime(value?: string | Date) {
  if (!value) return "-"
  const target = moment(value)
  if (!target.isValid()) return "-"
  return target.format("YYYY-MM-DD HH:mm:ss")
}

function createPublishForm(overrides: Partial<PublishForm> = {}): PublishForm {
  return {
    ...initialPublishFormData,
    ...overrides,
    id: overrides.id === undefined || overrides.id === null ? undefined : Number(overrides.id),
    name: String(overrides.name ?? initialPublishFormData.name),
    country: String(overrides.country ?? initialPublishFormData.country),
    province: String(overrides.province ?? initialPublishFormData.province),
    city: String(overrides.city ?? initialPublishFormData.city),
    area: String(overrides.area ?? initialPublishFormData.area),
    areaDetail: String(overrides.areaDetail ?? initialPublishFormData.areaDetail),
    postalCode: String(overrides.postalCode ?? initialPublishFormData.postalCode),
    telephone: String(overrides.telephone ?? initialPublishFormData.telephone),
    email: String(overrides.email ?? initialPublishFormData.email),
  }
}

function normalizePublishPayload(raw: PublishForm, overrideId?: PublishId): PublishForm {
  const toOptionalValue = (value?: string) => {
    const text = normalizeText(value)
    return text || undefined
  }
  return {
    id: overrideId === undefined ? undefined : Number(overrideId),
    name: normalizeText(raw.name),
    country: toOptionalValue(raw.country),
    province: toOptionalValue(raw.province),
    city: toOptionalValue(raw.city),
    area: toOptionalValue(raw.area),
    areaDetail: toOptionalValue(raw.areaDetail),
    postalCode: toOptionalValue(raw.postalCode),
    telephone: toOptionalValue(raw.telephone),
    email: toOptionalValue(raw.email),
  }
}

function getSelectedRows() {
  return table.value?.tableApi?.getFilteredSelectedRowModel().flatRows ?? []
}

function applySearchParams() {
  queryParams.field = searchForm.field
  const keyword = searchForm.keyword.trim()
  queryParams.keyword = keyword || void 0
}

async function handleQuery() {
  queryParams.pageNum = 1
  applySearchParams()
  await fetchData()
}

function resetQuery() {
  searchForm.field = "publishName"
  searchForm.keyword = ""
  void handleQuery()
}

async function fetchData() {
  try {
    loadingPageData.value = true
    const data = await publishApi.getPage(queryParams)
    pageData.value = data.list ?? []
    total.value = data.total ?? 0
  } catch (error) {
    console.error(error)
    pageData.value = []
    total.value = 0
    toast.add({title: "错误", description: "出版社数据加载失败", color: "error"})
  } finally {
    loadingPageData.value = false
  }
}

function resetForm() {
  state.value = createPublishForm()
  editModalMode.value = "add"
  editModalTitle.value = "新增出版社"
  editingPublishId.value = void 0
  submittingPublish.value = false
  loadingEditPublish.value = false
}

function openAddPublishModal() {
  editModalMode.value = "add"
  editModalTitle.value = "新增出版社"
  editingPublishId.value = void 0
  state.value = createPublishForm()
  open.value = true
}

async function openEditPublishModal(id: PublishId | undefined) {
  if (id === undefined || id === null) return
  editModalMode.value = "edit"
  editModalTitle.value = "修改出版社"
  editingPublishId.value = Number(id)
  loadingEditPublish.value = true
  try {
    const data = await publishApi.getFormData(id)
    state.value = createPublishForm(data ?? {})
    open.value = true
  } catch (error) {
    console.error(error)
    toast.add({title: "错误", description: "出版社信息加载失败", color: "error"})
  } finally {
    loadingEditPublish.value = false
  }
}

function openEditPublishBySelection() {
  const selectedRow = getSelectedRows()[0]?.original
  if (selectedRow?.publishId === undefined || selectedRow?.publishId === null) {
    toast.add({title: "错误", description: "请选择需要修改的出版社", color: "error"})
    return
  }
  void openEditPublishModal(selectedRow.publishId)
}

async function submitForm() {
  if (submittingPublish.value || loadingEditPublish.value) return
  const payload = normalizePublishPayload(
      state.value,
      editModalMode.value === "edit" ? editingPublishId.value : undefined
  )
  if (!payload.name) {
    toast.add({title: "错误", description: "名称不可为空", color: "error"})
    return
  }
  try {
    submittingPublish.value = true
    if (editModalMode.value === "add") {
      await publishApi.create(payload)
      toast.add({title: "成功", description: "新增成功", color: "success"})
    } else {
      if (payload.id === undefined || payload.id === null) {
        toast.add({title: "错误", description: "出版社ID不能为空", color: "error"})
        return
      }
      await publishApi.update(payload)
      toast.add({title: "成功", description: "修改成功", color: "success"})
    }
    open.value = false
    await fetchData()
  } catch (error) {
    console.error(error)
    toast.add({title: "错误", description: editModalMode.value === "add" ? "新增失败" : "修改失败", color: "error"})
  } finally {
    submittingPublish.value = false
  }
}

async function deletePublishBySelection() {
  if (deletingPublish.value) return
  const selectedRows = getSelectedRows()
  if (!selectedRows.length) {
    toast.add({title: "错误", description: "请选择需要删除的出版社", color: "error"})
    return
  }
  const selectedPublishes = selectedRows
      .map((row) => row.original)
      .filter((item) => item.publishId !== undefined && item.publishId !== null)
  const ids = selectedPublishes
      .map((item) => Number(item.publishId))
      .filter((id) => Number.isFinite(id))
  if (!ids.length) {
    toast.add({title: "错误", description: "无可删除的出版社数据", color: "error"})
    return
  }
  const content = ids.length === 1
      ? `确定删除出版社 ${selectedPublishes[0]?.publishName || ids[0]} 吗？`
      : `确定删除选中的 ${ids.length} 个出版社吗？`
  try {
    await ElMessageBox.confirm(content, "删除出版社", {
      type: "warning",
      confirmButtonText: "确定",
      cancelButtonText: "取消"
    })
  } catch {
    return
  }
  try {
    deletingPublish.value = true
    await publishApi.delete(ids)
    toast.add({title: "成功", description: "删除成功", color: "success"})
    table.value?.tableApi?.toggleAllPageRowsSelected(false)
    await fetchData()
  } catch (error) {
    console.error(error)
    toast.add({title: "错误", description: "删除失败", color: "error"})
  } finally {
    deletingPublish.value = false
  }
}
</script>

<template>
  <UModal
      v-model:open="open"
      :title="editModalTitle"
      :ui="{ content: 'sm:max-w-3xl rounded-[28px] border-0 bg-white shadow-[var(--library-shadow)]' }"
  >
    <template #body>
      <div class="modal-copy">
        <p class="modal-title">出版社资料</p>
        <p class="modal-description">维护出版社名称、联系方式与地址信息。</p>
      </div>
      <UForm ref="form" :schema="schema" :state="state" @submit.prevent="submitForm" class="mt-5 space-y-4">
        <div class="publish-modal-grid">
          <UFormField class="w-full" label="名称" name="name" required>
            <UInput class="w-full" v-model="state.name" placeholder="请输入出版社名称"/>
          </UFormField>
          <UFormField class="w-full" label="联系电话" name="telephone">
            <UInput class="w-full" v-model="state.telephone" placeholder="请输入联系电话"/>
          </UFormField>
        </div>
        <div class="publish-modal-grid">
          <UFormField class="w-full" label="电子邮箱" name="email">
            <UInput v-model="state.email" class="w-full" type="email" placeholder="请输入电子邮箱"/>
          </UFormField>
          <UFormField class="w-full" label="邮编" name="postalCode">
            <UInput class="w-full" v-model="state.postalCode" placeholder="请输入邮编"/>
          </UFormField>
        </div>
        <UFormField class="w-full" label="地址">
          <div class="publish-address-grid">
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
      <div class="flex w-full justify-end gap-2">
        <UButton @click="open = false" variant="ghost" label="取消"/>
        <UButton @click="form?.submit()" :loading="submittingPublish || loadingEditPublish" variant="subtle" color="error"
                 label="保存"/>
      </div>
    </template>
  </UModal>

  <UCard
      class="system-page-card flex h-full min-h-0 flex-col"
      :ui="{ header: 'p-6 pb-0', body: 'flex-1 min-h-0 p-6 pt-0', footer: 'px-6 pb-6 pt-4' }"
  >
    <template #header>
      <div class="page-header">
        <div class="page-copy">
          <p class="page-kicker">PUBLISHER DIRECTORY</p>
          <h1 class="page-title">出版社管理</h1>
          <p class="page-description">统一维护出版社名录、联系方式与通讯地址。</p>
        </div>
        <div class="page-stats">
          <div class="stat-item">
            <span class="stat-label">记录总数</span>
            <strong class="stat-value">{{ total }}</strong>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前页</span>
            <strong class="stat-value">{{ queryParams.pageNum }}</strong>
          </div>
          <div class="stat-item">
            <span class="stat-label">每页条数</span>
            <strong class="stat-value">{{ queryParams.pageSize }}</strong>
          </div>
        </div>
      </div>

      <div class="query-card">
        <div class="action-row">
          <ActionGroup
              :table="table"
              @flush="fetchData"
              @add-row="openAddPublishModal"
              @modify-row="openEditPublishBySelection"
              @delete-row="deletePublishBySelection"
          />
        </div>
        <UForm @submit.prevent="handleQuery" class="w-full">
          <div class="query-row">
            <USelect v-model="searchForm.field" defaultValue="publishName" :items="fieldItems" class="w-28"/>
            <UInput
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
      </div>
    </template>
    <div class="table-card">
      <UTable
          class="h-full"
          ref="table"
          v-model:column-visibility="columnVisibility"
          sticky
          :data="pageData"
          :columns="columns"
          :loading="loadingPageData"
          loading-color="primary"
          loading-animation="carousel"
      />
    </div>
    <template #footer>
      <div class="page-footer">
        <p class="footer-summary">当前共 {{ total }} 条出版社记录</p>
        <UPagination
            v-model:page="queryParams.pageNum"
            :total="total"
            :items-per-page="queryParams.pageSize"
            @update:page="fetchData"
        />
      </div>
    </template>
  </UCard>
</template>

<style scoped>
.system-page-card {
  border: 0;
  border-radius: 28px;
  background: rgb(255 255 255 / 96%);
  box-shadow: var(--library-shadow-soft);
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.page-kicker,
.stat-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--library-accent);
}

.page-title {
  margin-top: 6px;
  font-size: 30px;
  font-weight: 800;
  color: var(--library-text);
}

.page-description,
.modal-description,
.footer-summary {
  color: var(--library-text-muted);
}

.page-description,
.modal-description {
  margin-top: 6px;
  font-size: 14px;
}

.page-stats {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-width: min(100%, 320px);
}

.stat-item {
  border-radius: 18px;
  padding: 14px 16px;
  background: var(--library-card-muted);
}

.stat-value {
  display: block;
  margin-top: 6px;
  font-size: 24px;
  font-weight: 800;
  color: var(--library-text);
}

.query-card {
  border-radius: 24px;
  padding: 18px;
  background: rgb(245 249 252 / 88%);
}

.action-row {
  margin-bottom: 14px;
}

.query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
}

.table-card {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 24px;
  background: rgb(255 255 255 / 88%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 72%);
}

.page-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal-copy {
  padding-bottom: 6px;
}

.modal-title {
  font-size: 20px;
  font-weight: 800;
  color: var(--library-text);
}

.publish-modal-grid {
  display: grid;
  gap: 0.75rem;
}

.publish-address-grid {
  display: grid;
  gap: 0.5rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

@media (min-width: 768px) {
  .publish-modal-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 640px) {
  .publish-address-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .publish-address-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

:deep(thead tr) {
  background: rgb(243 247 250 / 92%);
}

:deep(th) {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--library-text-muted);
}

:deep(tbody tr) {
  transition: background-color 180ms ease;
}

:deep(tbody tr:hover) {
  background: rgb(245 249 252 / 82%);
}

@media (max-width: 960px) {
  .page-stats {
    width: 100%;
    grid-template-columns: 1fr;
  }
}
</style>
