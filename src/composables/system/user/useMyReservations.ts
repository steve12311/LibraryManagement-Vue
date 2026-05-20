import { reactive, ref, shallowRef } from "vue";
import ReservationApi, {
  type ReservationPageVO,
  type ReservationQuery,
} from "@/api/library/reservation-api";
import type { ReservationStatusFilterValue } from "@/enums/system/reservation-status-enum";
import {
  createReservationStatusItems,
  getReservationStatusColor,
  getReservationStatusLabel,
  normalizeReservationStatus,
  isReservationCancellable,
} from "@/utils/reservation-status";

function normalizeText(value?: string) {
  return String(value ?? "").trim();
}

function normalizeReservationRecord(raw?: Partial<ReservationPageVO>): ReservationPageVO {
  return {
    id: normalizeText(raw?.id),
    isbn: normalizeText(raw?.isbn),
    cover: raw?.cover,
    bookName: normalizeText(raw?.bookName),
    status: normalizeReservationStatus(raw?.status),
    pickupDeadline: raw?.pickupDeadline ?? null,
    createTime: normalizeText(raw?.createTime),
  };
}

/** 个人预约记录：分页查询 + 状态筛选 */
export function useMyReservations() {
  const toast = useToast();
  const requestSerial = ref(0);
  const loadingMyReservations = ref(false);
  const myReservations = shallowRef<ReservationPageVO[]>([]);
  const totalMyReservations = ref(0);
  const myReservationQueryParams = reactive<ReservationQuery>({
    pageNum: 1,
    pageSize: 6,
    field: "isbn",
    keyword: void 0,
  });
  const myReservationStatusFilter = ref<ReservationStatusFilterValue>(-1);
  const myReservationStatusItems = ref(createReservationStatusItems(true));

  function applyReservationFilters() {
    if (myReservationStatusFilter.value === -1) {
      myReservationQueryParams.field = "isbn";
      myReservationQueryParams.keyword = void 0;
    } else {
      myReservationQueryParams.field = "status";
      myReservationQueryParams.keyword = myReservationStatusFilter.value;
    }
  }

  async function fetchMyReservations() {
    const currentRequestSerial = ++requestSerial.value;
    try {
      loadingMyReservations.value = true;
      applyReservationFilters();
      const data = await ReservationApi.getPage(myReservationQueryParams);
      if (currentRequestSerial !== requestSerial.value) return;
      myReservations.value = Array.isArray(data.list)
        ? data.list.map((item) => normalizeReservationRecord(item))
        : [];
      totalMyReservations.value = Number(data.total ?? 0);
    } catch (error) {
      if (currentRequestSerial !== requestSerial.value) return;
      myReservations.value = [];
      totalMyReservations.value = 0;
      toast.add({
        title: "错误",
        description: error instanceof Error ? error.message : "预约记录加载失败",
        color: "error",
      });
    } finally {
      if (currentRequestSerial === requestSerial.value) {
        loadingMyReservations.value = false;
      }
    }
  }

  async function handleReservationQuery() {
    myReservationQueryParams.pageNum = 1;
    await fetchMyReservations();
  }

  function resetReservationQuery() {
    myReservationStatusFilter.value = -1;
    myReservationQueryParams.pageNum = 1;
    void fetchMyReservations();
  }

  function formatReservationDateTime(value?: string) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleString("zh-CN");
  }

  function getDaysRemaining(pickupDeadline?: string | null) {
    if (!pickupDeadline) return null;
    const deadline = new Date(pickupDeadline);
    if (Number.isNaN(deadline.getTime())) return null;
    const now = new Date();
    const diffMs = deadline.getTime() - now.getTime();
    if (diffMs <= 0) return 0;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  function isReservationCancellableCheck(status: ReturnType<typeof normalizeReservationStatus>) {
    return isReservationCancellable(status);
  }

  return {
    myReservations,
    totalMyReservations,
    loadingMyReservations,
    myReservationQueryParams,
    myReservationStatusFilter,
    myReservationStatusItems,
    fetchMyReservations,
    handleReservationQuery,
    resetReservationQuery,
    getReservationStatusLabel,
    getReservationStatusColor,
    formatReservationDateTime,
    getDaysRemaining,
    isReservationCancellable: isReservationCancellableCheck,
  };
}
