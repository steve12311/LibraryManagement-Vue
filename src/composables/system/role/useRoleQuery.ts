import { reactive, ref, shallowRef } from "vue"
import RoleAPI, { type RolePageQuery, type RolePageVO } from "@/api/system/role-api"

export function useRoleQuery() {
  const toast = useToast()
  const queryParams = reactive<RolePageQuery>({ pageNum: 1, pageSize: 10 })
  const searchForm = reactive({ keywords: "" })
  const total = ref(0)
  const roleList = shallowRef<RolePageVO[]>([])
  const loadingPageData = ref(false)

  function applySearchParams() {
    const keywords = searchForm.keywords.trim()
    queryParams.keywords = keywords || undefined
  }

  function handleQuery() {
    queryParams.pageNum = 1
    applySearchParams()
    void fetchData()
  }

  function resetQuery() {
    searchForm.keywords = ""
    handleQuery()
  }

  async function fetchData() {
    try {
      loadingPageData.value = true
      const data = await RoleAPI.getPage(queryParams)
      roleList.value = data.list ?? []
      total.value = data.total ?? 0
    } catch {
      toast.add({ title: "错误", description: "数据加载失败", color: "error" })
    } finally {
      loadingPageData.value = false
    }
  }

  return { queryParams, searchForm, total, roleList, loadingPageData, handleQuery, resetQuery, fetchData, applySearchParams }
}
