<script setup lang="ts">
import {computed, onMounted, reactive, ref, shallowRef} from "vue";
import {ElTable, ElTableColumn, vLoading} from "element-plus";
import { StatusTypeEnum } from "@/enums/system/status-enum";
import { createStatusOptions } from "@/utils/option-items";
import categoryApi, {
  type CategoryId,
  type CategoryQuery,
  type CategoryStatus,
  type CategoryVO
} from "@/api/library/category-api.ts";
import SystemPageHeader from "@/components/system/SystemPageHeader.vue";
import SystemQueryCard from "@/components/system/SystemQueryCard.vue";

type ColumnVisibilityKey = "categoryId" | "code";

interface ActionColumn {
  id: ColumnVisibilityKey
  columnDef: {
    header: string
  }
  getCanHide(): boolean
  getIsVisible(): boolean
}

interface ActionTable {
  tableApi: {
    getFilteredSelectedRowModel(): {
      flatRows: unknown[]
    }
    getAllColumns(): ActionColumn[]
    getColumn(columnId: string): {
      toggleVisibility(checked: boolean): void
    } | undefined
  }
}

type ResolveCategoryChildren = (data: CategoryVO[]) => void;

const toast = useToast()

const categoryList = shallowRef<CategoryVO[]>([])
const loadingCategoryList = ref(false)
const requestSerial = ref(0)
const tableRenderKey = ref(0)
const queryParams = reactive<CategoryQuery>({
  parentId: void 0,
  categoryName: void 0,
  status: void 0
})
const searchForm = reactive({
  categoryName: "",
  status: -1 as CategoryStatus | -1
})
const statusItems = ref(createStatusOptions(true))
const columnVisibility = reactive<Record<ColumnVisibilityKey, boolean>>({
  categoryId: false,
  code: true
})
const searchingCategoryTree = computed(() => Boolean(queryParams.categoryName))
const categoryNodeStat = computed(() => ({
  label: searchingCategoryTree.value ? "匹配节点" : "根级节点",
  value: categoryList.value.length
}))
const actionTable = computed<ActionTable>(() => ({
  tableApi: {
    getFilteredSelectedRowModel() {
      return {flatRows: []}
    },
    getAllColumns() {
      return ([
        {id: "categoryId", header: "分类ID"},
        {id: "code", header: "分类代码"}
      ] as const).map(({id, header}) => createActionColumn(id, header))
    },
    getColumn(columnId: string) {
      const columnKey = toColumnVisibilityKey(columnId)
      if (!columnKey) return void 0
      return {
        toggleVisibility(checked: boolean) {
          columnVisibility[columnKey] = checked
        }
      }
    }
  }
}))

onMounted(() => {
  void handleQuery()
})

function createActionColumn(id: ColumnVisibilityKey, header: string): ActionColumn {
  return {
    id,
    columnDef: {header},
    getCanHide: () => true,
    getIsVisible: () => columnVisibility[id]
  }
}

function toColumnVisibilityKey(value: string): ColumnVisibilityKey | undefined {
  if (value === "categoryId" || value === "code") return value
  return void 0
}

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
    hasChildren: typeof item?.hasChildren === "boolean" ? item.hasChildren : children.length > 0,
    children,
  }
}

function normalizeCategoryTree(data?: CategoryVO[] | null) {
  if (!Array.isArray(data)) return []
  return data.map((item) => normalizeCategory(item))
}

function applySearchParams() {
  queryParams.parentId = void 0
  queryParams.categoryName = normalizeText(searchForm.categoryName)
  queryParams.status = searchForm.status === -1 ? void 0 : searchForm.status
}

function buildRootChildrenQuery(): CategoryQuery {
  return {
    parentId: 0 as CategoryId,
    status: queryParams.status
  }
}

function buildChildrenQuery(parentId: CategoryId): CategoryQuery {
  return {
    parentId,
    status: queryParams.status
  }
}

async function fetchData() {
  const currentRequestSerial = ++requestSerial.value
  tableRenderKey.value += 1
  try {
    loadingCategoryList.value = true
    const data = searchingCategoryTree.value
        ? await categoryApi.getList(queryParams)
        : await categoryApi.getChildren(buildRootChildrenQuery())
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

async function loadCategoryChildren(row: CategoryVO, _: unknown, resolve: ResolveCategoryChildren) {
  const parentId = toCategoryId(row.categoryId)
  if (parentId === void 0) {
    resolve([])
    return
  }

  const currentRequestSerial = requestSerial.value
  try {
    const data = await categoryApi.getChildren(buildChildrenQuery(parentId))
    if (currentRequestSerial !== requestSerial.value) {
      resolve([])
      return
    }
    resolve(normalizeCategoryTree(data))
  } catch (error) {
    console.error(error)
    toast.add({title: "错误", description: "分类子节点加载失败", color: "error"})
    resolve([])
  }
}
</script>

<template>
  <div class="system-page-shell">
    <div class="system-page-shell__header">
      <SystemPageHeader
          kicker="CATEGORY"
          title="图书分类"
          description="分类树维护与启停管理"
          :stats="[
            categoryNodeStat,
            { label: '状态筛选', value: searchForm.status === -1 ? '全部' : searchForm.status === StatusTypeEnum.ACCESS ? '启用' : '停用' },
            { label: '搜索词', value: searchForm.categoryName.trim() || '未设置' }
          ]"
      />

      <SystemQueryCard>
        <template #actions>
          <ActionGroup :table="actionTable" @flush="fetchData">
            <UForm @submit.prevent="handleQuery" class="w-full">
              <div class="system-query-row">
                <UInput v-model="searchForm.categoryName" icon="i-lucide-search" size="md" variant="outline"
                        class="w-full sm:w-72"
                        placeholder="请输入分类名称/分类代码"/>
                <USelect v-model="searchForm.status" :items="statusItems" class="w-28"/>
                <UButton type="submit" icon="i-lucide-search" :loading="loadingCategoryList" label="搜索"/>
                <UButton type="button" variant="ghost" icon="i-lucide-rotate-ccw"
                         :disabled="loadingCategoryList" label="重置" @click="resetQuery"/>
              </div>
            </UForm>
          </ActionGroup>
        </template>
      </SystemQueryCard>
    </div>
    <div class="system-page-shell__main">
      <div class="system-table-card">
        <ElTable
            :key="tableRenderKey"
            v-loading="loadingCategoryList"
            :data="categoryList"
            :lazy="!searchingCategoryTree"
            :load="loadCategoryChildren"
            :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
            row-key="categoryId"
            height="100%"
            class="category-table"
            empty-text="暂无分类数据"
        >
          <ElTableColumn prop="categoryName" label="分类名称" min-width="260">
            <template #default="{ row }">
              {{ row.categoryName || "-" }}
            </template>
          </ElTableColumn>
          <ElTableColumn v-if="columnVisibility.code" prop="code" label="分类代码" min-width="160">
            <template #default="{ row }">
              {{ row.code || "-" }}
            </template>
          </ElTableColumn>
          <ElTableColumn v-if="columnVisibility.categoryId" prop="categoryId" label="分类ID" width="120"/>
        </ElTable>
      </div>
    </div>
  </div>
</template>

<style scoped>
.category-table {
  --el-table-border-color: var(--library-border);
  --el-table-header-bg-color: color-mix(in srgb, var(--library-card-muted) 90%, transparent);
  --el-table-row-hover-bg-color: color-mix(in srgb, var(--library-card-muted) 72%, transparent);
  --el-table-tr-bg-color: var(--library-card);
  --el-table-bg-color: var(--library-card);
  --el-table-header-text-color: var(--ui-text-highlighted);
  --el-table-text-color: var(--library-text);
}

.category-table:deep(.el-table__cell) {
  font-size: 13px;
}

.category-table:deep(.el-table__header .cell) {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.category-table:deep(.el-table__inner-wrapper::before) {
  background: var(--library-border);
}
</style>
