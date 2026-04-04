<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, shallowRef, useTemplateRef} from "vue";
import type {SelectItem, TableColumn} from "@nuxt/ui";
import categoryApi, {
  type CategoryId,
  type CategoryQuery,
  type CategoryStatus,
  type CategoryVO
} from "@/api/library/category-api.ts";
import SystemPageHeader from "@/components/system/SystemPageHeader.vue";
import SystemQueryCard from "@/components/system/SystemQueryCard.vue";

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
  <div class="system-page-shell">
    <div class="system-page-shell__header">
      <SystemPageHeader
          kicker="CATEGORY MANAGEMENT"
          title="图书分类"
          description="维护分类树结构、分类代码和启停状态，保持馆藏目录整洁一致。"
          :stats="[
            { label: '分类节点', value: categoryList.length },
            { label: '状态筛选', value: searchForm.status === -1 ? '全部' : searchForm.status === 1 ? '启用' : '停用' },
            { label: '搜索词', value: searchForm.categoryName.trim() || '未设置' }
          ]"
      />

      <SystemQueryCard>
        <template #actions>
          <ActionGroup :table="table" @flush="fetchData"/>
        </template>
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
      </SystemQueryCard>
    </div>
    <div class="system-page-shell__main">
      <div class="system-table-card">
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
    </div>
  </div>
</template>
