import {ref} from "vue";
import type {SelectMenuItem} from "@nuxt/ui";
import categoryApi, {type CategoryLazyOption} from "@/api/library/category-api.ts";
import publishApi from "@/api/library/publish-api.ts";

interface CategoryTreeNode {
  level?: number
  data?: {
    value?: string | number
  }
}

export function useStockOptions() {
  const toast = useToast()
  const publishOptions = ref<SelectMenuItem[]>([])
  const categoryTreeOptions = ref<CategoryLazyOption[]>([])
  const categoryTreeCacheData = ref<CategoryLazyOption[]>([])
  const loadingOptions = ref(false)

  async function fetchPublishOptions() {
    publishOptions.value = await publishApi.getOptions()
  }

  function normalizeCategoryId(value: unknown): number | undefined {
    const id = Number(value)
    if (!Number.isInteger(id) || id < 0) {
      return void 0
    }
    return id
  }

  function mergeCategoryCacheNode(node?: CategoryLazyOption | null) {
    if (!node) return
    const nodeId = normalizeCategoryId(node.value)
    if (nodeId === void 0) return
    const rest = categoryTreeCacheData.value.filter((item) => normalizeCategoryId(item.value) !== nodeId)
    categoryTreeCacheData.value = [...rest, node]
  }

  async function fetchCategoryRootOptions() {
    categoryTreeOptions.value = await categoryApi.getLazyOptions(0)
  }

  async function ensureCategoryNodeCache(categoryId: unknown) {
    const id = normalizeCategoryId(categoryId)
    if (id === void 0) return
    if (categoryTreeCacheData.value.some((item) => normalizeCategoryId(item.value) === id)) {
      return
    }
    const node = await categoryApi.getOptionNode(id)
    mergeCategoryCacheNode(node)
  }

  async function loadCategoryTreeNode(node: CategoryTreeNode, resolve: (data: CategoryLazyOption[]) => void) {
    if (node?.level === 0) {
      resolve(categoryTreeOptions.value)
      return
    }

    const parentId = normalizeCategoryId(node?.data?.value)
    if (parentId === void 0) {
      resolve([])
      return
    }

    try {
      const children = await categoryApi.getLazyOptions(parentId)
      resolve(children || [])
    } catch (error) {
      console.error(error)
      toast.add({title: "错误", description: "加载分类节点失败", color: "error"})
      resolve([])
    }
  }

  async function fetchEntryOptions() {
    await Promise.all([fetchPublishOptions(), fetchCategoryRootOptions()])
  }

  return {
    publishOptions,
    categoryTreeOptions,
    categoryTreeCacheData,
    loadingOptions,
    fetchPublishOptions,
    fetchCategoryRootOptions,
    ensureCategoryNodeCache,
    loadCategoryTreeNode,
    fetchEntryOptions,
  }
}
