import { reactive, ref, shallowRef, watch } from "vue";
import type { SelectItem } from "@nuxt/ui";
import ReservationApi, {
  type AdminReservationPageVO,
  type ReservationQuery,
} from "@/api/library/reservation-api";
import { createReservationStatusItems } from "@/utils/reservation-status";
import type { ReservationStatusFilterValue } from "@/enums/system/reservation-status-enum";

export function useReservationQuery() {
  const toast = useToast();
  const queryParams = reactive<ReservationQuery>({
    pageNum: 1,
    pageSize: 10,
    field: "isbn",
    keyword: void 0,
  });
  const searchForm = reactive({
    field: "isbn" as ReservationQuery["field"],
    keyword: "",
    status: -1 as ReservationStatusFilterValue,
  });
  const fieldItems = ref<SelectItem[]>([
    { label: "用户名", value: "username" },
    { label: "ISBN", value: "isbn" },
    { label: "状态", value: "status" },
  ]);
  const statusItems = ref<SelectItem[]>(createReservationStatusItems(true));
  const total = ref(0);
  const pageData = shallowRef<AdminReservationPageVO[]>([]);
  const loadingPageData = ref(false);

  watch(
    () => searchForm.field,
    (field) => {
      if (field === "status") {
        searchForm.keyword = "";
        return;
      }
      searchForm.status = -1;
    },
  );

  function applySearchParams() {
    queryParams.field = searchForm.field;
    if (searchForm.field === "status") {
      queryParams.keyword = searchForm.status === -1 ? void 0 : searchForm.status;
      return;
    }
    const keyword = searchForm.keyword.trim();
    queryParams.keyword = keyword || void 0;
  }

  async function handleQuery() {
    applySearchParams();
    queryParams.pageNum = 1;
    await fetchData();
  }

  function resetQuery() {
    searchForm.field = "isbn";
    searchForm.keyword = "";
    searchForm.status = -1;
    void handleQuery();
  }

  async function fetchData() {
    try {
      loadingPageData.value = true;
      const data = await ReservationApi.adminGetPage(queryParams);
      pageData.value = data.list;
      total.value = data.total;
    } catch {
      pageData.value = [];
      total.value = 0;
      toast.add({ title: "错误", description: "数据加载失败", color: "error" });
    } finally {
      loadingPageData.value = false;
    }
  }

  return {
    queryParams,
    searchForm,
    fieldItems,
    statusItems,
    total,
    pageData,
    loadingPageData,
    handleQuery,
    resetQuery,
    fetchData,
  };
}
