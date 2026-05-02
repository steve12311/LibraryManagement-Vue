import { reactive, ref, shallowRef } from "vue"
import type { SelectItem } from "@nuxt/ui"
import publishApi, { type PublishPageVO, type PublishQuery } from "@/api/library/publish-api"

export function usePublishQuery() {
  const toast = useToast()
  const queryParams = reactive<PublishQuery>({ pageNum: 1, pageSize: 10, field: "publishName", keyword: void 0 })
  const searchForm = reactive({ field: "publishName" as PublishQuery["field"], keyword: "" })
  const fieldItems = ref<SelectItem[]>([{ label: "名称", value: "publishName" }, { label: "地址", value: "address" }])
  const total = ref(0)
  const pageData = shallowRef<PublishPageVO[]>([])
  const loadingPageData = ref(false)

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
    } catch {
      pageData.value = []
      total.value = 0
      toast.add({ title: "错误", description: "出版社数据加载失败", color: "error" })
    } finally {
      loadingPageData.value = false
    }
  }

  return { queryParams, searchForm, fieldItems, total, pageData, loadingPageData, handleQuery, resetQuery, fetchData }
}
