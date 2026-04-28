import {reactive, ref, shallowRef} from "vue";
import stockApi, {type StockPageVO, type StockQuery} from "@/api/library/stock-api.ts";
import FileApi from "@/api/file-api.ts";

/** 库存列表查询：分页 + 搜索 + 图片缓存 */
export function useStockQuery() {
  const toast = useToast()
  const pageDate = shallowRef<StockPageVO[]>([])
  const loadingPageData = ref(false)
  const total = ref(0)
  const imageCache = new Map<string, string>()
  const queryParams = reactive<StockQuery>({
    pageNum: 1,
    pageSize: 10,
    field: "name",
    keyword: void 0,
  })

  function normalizeKeyword(value?: string) {
    const keyword = String(value ?? "").trim()
    return keyword || void 0
  }

  function applySearchParams() {
    queryParams.keyword = normalizeKeyword(queryParams.keyword)
  }

  function fetchImage(originalUrl: string | undefined) {
    if (!originalUrl) {
      return void 0
    }

    const cachedUrl = imageCache.get(originalUrl)
    if (cachedUrl) {
      return cachedUrl
    }

    const resolvedUrl = FileApi.resolveUrl(originalUrl)
    if (!resolvedUrl) {
      return void 0
    }

    imageCache.set(originalUrl, resolvedUrl)
    return resolvedUrl
  }

  async function fetchData() {
    try {
      loadingPageData.value = true
      applySearchParams()
      const data = await stockApi.getPage(queryParams)
      total.value = data.total
      pageDate.value = data.list.map((item) => ({
        ...item,
        bookImage: fetchImage(item.bookImage),
      }))
    } catch (error) {
      console.error(error)
      pageDate.value = []
      total.value = 0
      toast.add({title: "错误", description: "库存数据加载失败", color: "error"})
    } finally {
      loadingPageData.value = false
    }
  }

  async function handleQuery() {
    queryParams.pageNum = 1
    await fetchData()
  }

  function resetQuery() {
    queryParams.field = "name"
    queryParams.keyword = void 0
    queryParams.pageNum = 1
    void fetchData()
  }

  return {
    queryParams,
    pageDate,
    total,
    loadingPageData,
    imageCache,
    normalizeKeyword,
    applySearchParams,
    handleQuery,
    resetQuery,
    fetchData,
    fetchImage,
  }
}
