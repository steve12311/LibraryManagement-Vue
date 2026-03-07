import {reactive, ref, shallowRef} from "vue";
import MenuAPI, {type MenuQuery, type MenuVO} from "@/api/system/menu-api";

export function useMenuQuery() {
  const toast = useToast();
  const queryParams = reactive<MenuQuery>({});
  const searchForm = reactive<MenuQuery>({
    keywords: "",
  });
  const menuTableData = shallowRef<MenuVO[]>([]);
  const loadingMenuList = ref(false);

  function applySearchParams() {
    const keywords = searchForm.keywords?.trim();
    queryParams.keywords = keywords || undefined;
  }

  async function handleQuery() {
    try {
      loadingMenuList.value = true;
      applySearchParams();
      menuTableData.value = await MenuAPI.getList(queryParams);
    } catch {
      toast.add({title: "错误", description: "菜单数据加载失败", color: "error"});
    } finally {
      loadingMenuList.value = false;
    }
  }

  function resetQuery() {
    searchForm.keywords = "";
    void handleQuery();
  }

  return {
    queryParams,
    searchForm,
    menuTableData,
    loadingMenuList,
    applySearchParams,
    handleQuery,
    resetQuery,
  };
}
