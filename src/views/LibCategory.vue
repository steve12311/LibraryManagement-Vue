<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, shallowRef, useTemplateRef} from "vue";
import type {SelectItem, TableColumn} from "@nuxt/ui";
import categoryApi, {
  type CategoryId,
  type CategoryQuery,
  type CategoryStatus,
  type CategoryVO
} from "@/api/library/category-api.ts";

const UButton = resolveComponent('UButton')
const toast = useToast()
const table = useTemplateRef("table")

const categoryList = shallowRef<CategoryVO[]>([])
const loadingCategoryList = ref(false)
const requestSerial = ref(0)
const queryParams = reactive<CategoryQuery>({
  categoryName: void 0,
  status: void 0
})
const searchForm = reactive({
  categoryName: "",
  status: -1 as CategoryStatus | -1
})
const statusItems = ref<SelectItem[]>([
  {
    label: "全部状态",
    value: -1
  },
  {
    label: "启用",
    value: 1
  },
  {
    label: "禁用",
    value: 0
  }
])
const columns = ref<TableColumn<CategoryVO>[]>([
  {
    accessorKey: "categoryId",
    header: "分类ID"
  },
  {
    accessorKey: "code",
    header: "分类代码",
    cell: ({row}) => row.original.code || "-"
  },
  {
    accessorKey: "categoryName",
    header: "分类名称",
    cell: ({row}) => {
      const canExpand = row.getCanExpand()
      const toggleExpanded = (event: Event) => {
        event.stopPropagation()
        if (!canExpand) return
        row.toggleExpanded()
      }
      return h("div", {
        style: {
          paddingLeft: `${Math.max(0, row.depth)}rem`
        },
        class: 'flex items-center gap-2'
      }, [
        h(UButton, {
          icon: row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus',
          class: !canExpand && 'invisible',
          size: 'xs',
          onClick: toggleExpanded
        }),
        row.original.categoryName || "-"
      ])
    }
  }
])
const columnVisibility = ref({
  categoryId: false
})
onMounted(() => {
  void handleQuery()
})

function normalizeText(value?: string) {
  const text = String(value ?? "").trim()
  return text || void 0
}

function toCategoryId(value: unknown) {
  const categoryId = Number(value)
  if (!Number.isInteger(categoryId) || categoryId < 0) return void 0
  return categoryId as CategoryId
}

function normalizeCategory(item?: CategoryVO): CategoryVO {
  const children = Array.isArray(item?.children) ? item.children.map((child) => normalizeCategory(child)) : []
  return {
    categoryId: toCategoryId(item?.categoryId),
    categoryName: normalizeText(item?.categoryName),
    parentId: toCategoryId(item?.parentId),
    code: normalizeText(item?.code),
    treePath: normalizeText(item?.treePath),
    children,
  }
}

function normalizeCategoryTree(data?: CategoryVO[] | null) {
  if (!Array.isArray(data)) return []
  return data.map((item) => normalizeCategory(item))
}

function applySearchParams() {
  queryParams.categoryName = normalizeText(searchForm.categoryName)
  queryParams.status = searchForm.status === -1 ? void 0 : searchForm.status
}

async function fetchData() {
  const currentRequestSerial = ++requestSerial.value
  try {
    loadingCategoryList.value = true
    const data = await categoryApi.getList(queryParams)
    if (currentRequestSerial !== requestSerial.value) return
    categoryList.value = normalizeCategoryTree(data)
  } catch (error) {
    if (currentRequestSerial !== requestSerial.value) return
    console.error(error)
    categoryList.value = []
    toast.add({title: "错误", description: "分类数据加载失败", color: "error"})
  } finally {
    if (currentRequestSerial === requestSerial.value) {
      loadingCategoryList.value = false
    }
  }
}

async function handleQuery() {
  applySearchParams()
  await fetchData()
}

function resetQuery() {
  searchForm.categoryName = ""
  searchForm.status = -1
  void handleQuery()
}

function getSubRows(row: CategoryVO) {
  return Array.isArray(row.children) ? row.children : []
}

</script>

<template>
  <UCard
      class="system-page-card flex h-full min-h-0 flex-col"
      :ui="{ header: 'p-6 pb-0', body: 'flex-1 min-h-0 p-6 pt-0' }"
  >
    <template #header>
      <div class="page-header">
        <div class="page-copy">
          <p class="page-kicker">CATEGORY MANAGEMENT</p>
          <h1 class="page-title">图书分类</h1>
          <p class="page-description">维护分类树结构、分类代码和启停状态，保持馆藏目录整洁一致。</p>
        </div>
        <div class="page-stats">
          <div class="stat-item">
            <span class="stat-label">分类节点</span>
            <strong class="stat-value">{{ categoryList.length }}</strong>
          </div>
          <div class="stat-item">
            <span class="stat-label">状态筛选</span>
            <strong class="stat-value">{{ searchForm.status === -1 ? "全部" : searchForm.status === 1 ? "启用" : "停用" }}</strong>
          </div>
          <div class="stat-item">
            <span class="stat-label">搜索词</span>
            <strong class="stat-value">{{ searchForm.categoryName.trim() || "未设置" }}</strong>
          </div>
        </div>
      </div>

      <div class="query-card">
        <div class="action-row">
          <ActionGroup :table="table" @flush="fetchData"/>
        </div>
        <UForm @submit.prevent="handleQuery" class="w-full">
          <div class="query-row">
            <UInput v-model="searchForm.categoryName" icon="i-lucide-search" size="md" variant="outline"
                    class="w-full sm:w-72"
                    placeholder="请输入分类名称/分类代码"/>
            <USelect v-model="searchForm.status" :items="statusItems" class="w-28"/>
            <UButton type="submit" icon="i-lucide-search" :loading="loadingCategoryList" label="搜索"/>
            <UButton type="button" variant="ghost" icon="i-lucide-rotate-ccw"
                     :disabled="loadingCategoryList" label="重置" @click="resetQuery"/>
          </div>
        </UForm>
      </div>
    </template>
    <div class="table-card">
      <UTable ref="table" :column-visibility="columnVisibility" :data="categoryList" :columns="columns"
              :loading="loadingCategoryList"
              loading-color="primary"
              loading-animation="carousel"
              :get-sub-rows="getSubRows"
              class="h-full"
              :ui="{
        base: 'border-separate border-spacing-0',
        tbody: '[&>tr]:last:[&>td]:border-b-0',
        tr: 'group',
        td: 'empty:p-0 group-has-[td:not(:empty)]:border-b border-default'
      }"/>
    </div>
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

.page-description {
  margin-top: 8px;
  font-size: 14px;
  color: var(--library-text-muted);
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
  gap: 10px;
}

.table-card {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 24px;
  background: rgb(255 255 255 / 88%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 72%);
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
