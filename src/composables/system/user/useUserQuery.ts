import { reactive, ref, shallowRef } from "vue";
import UserAPI, { type UserPageQuery, type UserPageVO } from "@/api/system/user-api";

export function useUserQuery() {
    const toast = useToast();
    const queryParams = reactive<UserPageQuery>({
        pageNum: 1,
        pageSize: 10,
    });
    const searchForm = reactive({
        keywords: "",
        status: -1,
    });
    const total = ref(0);
    const pageData = shallowRef<UserPageVO[]>([]);
    const loadingPageData = ref(false);

    function applySearchParams() {
        const keywords = searchForm.keywords.trim();
        queryParams.keywords = keywords || undefined;
        queryParams.status = searchForm.status === -1 ? undefined : (searchForm.status as 0 | 1);
    }

    function handleQuery() {
        queryParams.pageNum = 1;
        applySearchParams();
        void fetchData();
    }

    function resetQuery() {
        searchForm.keywords = "";
        searchForm.status = -1;
        handleQuery();
    }

    async function fetchData() {
        try {
            loadingPageData.value = true;
            const data = await UserAPI.getPage(queryParams);
            pageData.value = data.list ?? [];
            total.value = data.total ?? 0;
        } catch {
            toast.add({title: "错误", description: "用户数据加载失败", color: "error"});
        } finally {
            loadingPageData.value = false;
        }
    }

    return {
        queryParams,
        searchForm,
        total,
        pageData,
        loadingPageData,
        handleQuery,
        resetQuery,
        fetchData,
    };
}
