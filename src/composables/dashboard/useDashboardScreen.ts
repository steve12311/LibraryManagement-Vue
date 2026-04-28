import { computed, reactive, ref, shallowRef } from "vue"
import DashboardApi, {
  type DashboardHotBook,
  type DashboardNamedCountItem,
  type DashboardOverview,
  type DashboardRankings,
  type DashboardRecentAuthLog,
  type DashboardRecentBorrow,
  type DashboardRecentEvents,
  type DashboardRecentEventsQuery,
  type DashboardRecentOperLog,
  type DashboardTrendPoint,
  type DashboardTrendQuery,
} from "@/api/dashboard-api"
import FileApi from "@/api/file-api"
import {
  getBorrowStatusColor,
  getBorrowStatusLabel,
  normalizeBorrowStatus
} from "@/utils/borrow-status"

type DashboardBlockKey = "overview" | "trend" | "ranking" | "recentEvents"
export type DashboardTrendWindow = "day-7" | "day-30" | "hour-24"

const DEFAULT_OVERVIEW: DashboardOverview = {
  bookTotal: 0,
  stockTotal: 0,
  availableStockTotal: 0,
  borrowingTotal: 0,
  returnedTotal: 0,
  overdueTotal: 0,
  enabledUserTotal: 0,
  todayLoginSuccessCount: 0,
  todayLoginFailureCount: 0,
  todayOperSuccessCount: 0,
  todayOperFailureCount: 0,
}

const DEFAULT_RANKINGS: DashboardRankings = {
  hotBooks: [],
  operationModules: [],
  authFailureUsers: [],
  authFailureIps: [],
}

const DEFAULT_RECENT_EVENTS: DashboardRecentEvents = {
  borrows: {
    list: [],
    total: 0,
  },
  operLogs: {
    list: [],
    total: 0,
  },
  authFailures: {
    list: [],
    total: 0,
  },
}

const TREND_WINDOW_QUERY_MAP: Record<DashboardTrendWindow, DashboardTrendQuery> = {
  "day-7": {
    mode: "day",
    days: 7,
  },
  "day-30": {
    mode: "day",
    days: 30,
  },
  "hour-24": {
    mode: "hour",
    hours: 24,
  },
}

function normalizeText(value?: string | null) {
  return String(value ?? "").trim()
}

function normalizeNumber(value?: number | string | null) {
  const normalizedValue = Number(value ?? 0)
  return Number.isFinite(normalizedValue) ? normalizedValue : 0
}

function normalizeDateText(value?: string | Date | null) {
  if (!value) {
    return "-"
  }
  const currentDate = new Date(value)
  if (Number.isNaN(currentDate.getTime())) {
    return "-"
  }
  return currentDate.toLocaleString("zh-CN", {
    hour12: false
  })
}

function normalizeOverview(raw?: Partial<DashboardOverview>): DashboardOverview {
  return {
    bookTotal: normalizeNumber(raw?.bookTotal),
    stockTotal: normalizeNumber(raw?.stockTotal),
    availableStockTotal: normalizeNumber(raw?.availableStockTotal),
    borrowingTotal: normalizeNumber(raw?.borrowingTotal),
    returnedTotal: normalizeNumber(raw?.returnedTotal),
    overdueTotal: normalizeNumber(raw?.overdueTotal),
    enabledUserTotal: normalizeNumber(raw?.enabledUserTotal),
    todayLoginSuccessCount: normalizeNumber(raw?.todayLoginSuccessCount),
    todayLoginFailureCount: normalizeNumber(raw?.todayLoginFailureCount),
    todayOperSuccessCount: normalizeNumber(raw?.todayOperSuccessCount),
    todayOperFailureCount: normalizeNumber(raw?.todayOperFailureCount),
  }
}

function normalizeTrendPoints(raw?: DashboardTrendPoint[]) {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.map((item) => ({
    timeBucket: normalizeText(item.timeBucket),
    label: normalizeText(item.label),
    bookTotal: normalizeNumber(item.bookTotal),
    stockTotal: normalizeNumber(item.stockTotal),
    availableStockTotal: normalizeNumber(item.availableStockTotal),
    borrowingTotal: normalizeNumber(item.borrowingTotal),
    returnedTotal: normalizeNumber(item.returnedTotal),
    overdueTotal: normalizeNumber(item.overdueTotal),
    enabledUserTotal: normalizeNumber(item.enabledUserTotal),
    loginSuccessCount: normalizeNumber(item.loginSuccessCount),
    loginFailureCount: normalizeNumber(item.loginFailureCount),
    operSuccessCount: normalizeNumber(item.operSuccessCount),
    operFailureCount: normalizeNumber(item.operFailureCount),
  }))
}

function normalizeNamedCountItems(raw?: DashboardNamedCountItem[]) {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.map((item) => ({
    name: normalizeText(item.name) || "未命名",
    count: normalizeNumber(item.count),
  }))
}

function normalizeHotBooks(raw?: DashboardHotBook[]) {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.map((item) => ({
    isbn: normalizeText(item.isbn),
    bookName: normalizeText(item.bookName) || "未知图书",
    cover: FileApi.resolveUrl(item.cover),
    count: normalizeNumber(item.count),
  }))
}

function normalizeRankings(raw?: Partial<DashboardRankings>): DashboardRankings {
  return {
    hotBooks: normalizeHotBooks(raw?.hotBooks),
    operationModules: normalizeNamedCountItems(raw?.operationModules),
    authFailureUsers: normalizeNamedCountItems(raw?.authFailureUsers),
    authFailureIps: normalizeNamedCountItems(raw?.authFailureIps),
  }
}

function normalizeRecentBorrows(raw?: DashboardRecentBorrow[]) {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.map((item) => ({
    borrowId: normalizeText(item.borrowId),
    isbn: normalizeText(item.isbn),
    cover: FileApi.resolveUrl(item.cover),
    bookName: normalizeText(item.bookName) || "未知图书",
    username: normalizeText(item.username) || "未知读者",
    returnTime: item.returnTime,
    status: normalizeBorrowStatus(item.status),
    createTime: item.createTime,
  }))
}

function normalizeRecentOperLogs(raw?: DashboardRecentOperLog[]) {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.map((item) => ({
    logId: normalizeNumber(item.logId),
    module: normalizeText(item.module) || "未知模块",
    action: normalizeText(item.action) || "未知动作",
    operatorUsername: normalizeText(item.operatorUsername) || "未知操作人",
    success: (normalizeNumber(item.success) === 1 ? 1 : 0) as 0 | 1,
    resultCode: normalizeText(item.resultCode) || "-",
    createTime: item.createTime,
  }))
}

function normalizeRecentAuthLogs(raw?: DashboardRecentAuthLog[]) {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.map((item) => ({
    logId: normalizeNumber(item.logId),
    eventType: normalizeText(item.eventType) || "未知事件",
    username: normalizeText(item.username) || "匿名",
    clientIp: normalizeText(item.clientIp) || "-",
    resultCode: normalizeText(item.resultCode) || "-",
    failureSummary: normalizeText(item.failureSummary) || "未提供失败摘要",
    createTime: item.createTime,
  }))
}

function normalizeRecentEvents(raw?: Partial<DashboardRecentEvents>): DashboardRecentEvents {
  return {
    borrows: {
      list: normalizeRecentBorrows(raw?.borrows?.list),
      total: normalizeNumber(raw?.borrows?.total),
    },
    operLogs: {
      list: normalizeRecentOperLogs(raw?.operLogs?.list),
      total: normalizeNumber(raw?.operLogs?.total),
    },
    authFailures: {
      list: normalizeRecentAuthLogs(raw?.authFailures?.list),
      total: normalizeNumber(raw?.authFailures?.total),
    },
  }
}

/**
 * 仪表盘数据大屏状态与数据拉取。
 * 所有 fetchXxx 使用请求序号机制防止快速切换时的竞态条件。
 */
export function useDashboardScreen() {
  const toast = useToast()
  const lastUpdatedAt = ref("")
  const activeTrendWindow = ref<DashboardTrendWindow>("day-7")
  const loadingOverview = ref(false)
  const loadingTrend = ref(false)
  const loadingRanking = ref(false)
  const loadingRecentEvents = ref(false)
  const refreshingAll = ref(false)
  const overview = ref<DashboardOverview>({...DEFAULT_OVERVIEW})
  const trendPoints = shallowRef<DashboardTrendPoint[]>([])
  const rankings = ref<DashboardRankings>({...DEFAULT_RANKINGS})
  const recentEvents = ref<DashboardRecentEvents>({...DEFAULT_RECENT_EVENTS})
  const blockErrors = reactive<Record<DashboardBlockKey, string>>({
    overview: "",
    trend: "",
    ranking: "",
    recentEvents: "",
  })
  const recentEventsQuery = reactive<DashboardRecentEventsQuery>({
    borrowPageNum: 1,
    borrowPageSize: 4,
    operPageNum: 1,
    operPageSize: 4,
    authPageNum: 1,
    authPageSize: 4,
  })
  const overviewRequestSerial = ref(0)
  const trendRequestSerial = ref(0)
  const rankingRequestSerial = ref(0)
  const recentEventsRequestSerial = ref(0)

  const trendWindowItems = [
    { label: "近 7 天", value: "day-7" },
    { label: "近 30 天", value: "day-30" },
    { label: "近 24 小时", value: "hour-24" },
  ] satisfies Array<{ label: string; value: DashboardTrendWindow }>

  const trendCategories = computed(() => trendPoints.value.map((item) => item.label))
  const businessTrendSeries = computed(() => [
    {
      name: "借阅中",
      data: trendPoints.value.map((item) => item.borrowingTotal),
      color: "#06b6d4",
    },
    {
      name: "已归还",
      data: trendPoints.value.map((item) => item.returnedTotal),
      color: "#10b981",
    },
    {
      name: "已逾期",
      data: trendPoints.value.map((item) => item.overdueTotal),
      color: "#f97316",
    },
  ])
  const securityTrendSeries = computed(() => [
    {
      name: "登录成功",
      data: trendPoints.value.map((item) => item.loginSuccessCount),
      color: "#22c55e",
    },
    {
      name: "登录失败",
      data: trendPoints.value.map((item) => item.loginFailureCount),
      color: "#ef4444",
    },
    {
      name: "操作成功",
      data: trendPoints.value.map((item) => item.operSuccessCount),
      color: "#3b82f6",
    },
    {
      name: "操作失败",
      data: trendPoints.value.map((item) => item.operFailureCount),
      color: "#f59e0b",
    },
  ])

  function setBlockError(blockKey: DashboardBlockKey, message = "") {
    blockErrors[blockKey] = message
  }

  function markRefreshed() {
    lastUpdatedAt.value = normalizeDateText(new Date())
  }

  /** 拉取总览数据（请求序号防竞态） */
  async function fetchOverview({ silent = false } = {}) {
    const currentRequestSerial = ++overviewRequestSerial.value
    try {
      loadingOverview.value = !silent
      setBlockError("overview")
      const data = await DashboardApi.getOverview()
      if (currentRequestSerial !== overviewRequestSerial.value) return
      overview.value = normalizeOverview(data)
      markRefreshed()
    } catch (error) {
      if (currentRequestSerial !== overviewRequestSerial.value) return
      overview.value = {...DEFAULT_OVERVIEW}
      setBlockError("overview", error instanceof Error ? error.message : "总览数据加载失败")
    } finally {
      if (currentRequestSerial === overviewRequestSerial.value) {
        loadingOverview.value = false
      }
    }
  }

  async function fetchTrend({ silent = false } = {}) {
    const currentRequestSerial = ++trendRequestSerial.value
    try {
      loadingTrend.value = !silent
      setBlockError("trend")
      const data = await DashboardApi.getTrends(TREND_WINDOW_QUERY_MAP[activeTrendWindow.value])
      if (currentRequestSerial !== trendRequestSerial.value) return
      trendPoints.value = normalizeTrendPoints(data)
      markRefreshed()
    } catch (error) {
      if (currentRequestSerial !== trendRequestSerial.value) return
      trendPoints.value = []
      setBlockError("trend", error instanceof Error ? error.message : "趋势数据加载失败")
    } finally {
      if (currentRequestSerial === trendRequestSerial.value) {
        loadingTrend.value = false
      }
    }
  }

  async function fetchRankings({ silent = false } = {}) {
    const currentRequestSerial = ++rankingRequestSerial.value
    try {
      loadingRanking.value = !silent
      setBlockError("ranking")
      const data = await DashboardApi.getRankings()
      if (currentRequestSerial !== rankingRequestSerial.value) return
      rankings.value = normalizeRankings(data)
      markRefreshed()
    } catch (error) {
      if (currentRequestSerial !== rankingRequestSerial.value) return
      rankings.value = {...DEFAULT_RANKINGS}
      setBlockError("ranking", error instanceof Error ? error.message : "排行数据加载失败")
    } finally {
      if (currentRequestSerial === rankingRequestSerial.value) {
        loadingRanking.value = false
      }
    }
  }

  async function fetchRecentEvents({ silent = false } = {}) {
    const currentRequestSerial = ++recentEventsRequestSerial.value
    try {
      loadingRecentEvents.value = !silent
      setBlockError("recentEvents")
      const data = await DashboardApi.getRecentEvents(recentEventsQuery)
      if (currentRequestSerial !== recentEventsRequestSerial.value) return
      recentEvents.value = normalizeRecentEvents(data)
      markRefreshed()
    } catch (error) {
      if (currentRequestSerial !== recentEventsRequestSerial.value) return
      recentEvents.value = {...DEFAULT_RECENT_EVENTS}
      setBlockError("recentEvents", error instanceof Error ? error.message : "最近事件加载失败")
    } finally {
      if (currentRequestSerial === recentEventsRequestSerial.value) {
        loadingRecentEvents.value = false
      }
    }
  }

  async function refreshAll({ silent = false } = {}) {
    refreshingAll.value = true
    try {
      await Promise.all([
        fetchOverview({silent}),
        fetchTrend({silent}),
        fetchRankings({silent}),
        fetchRecentEvents({silent}),
      ])
      const hasError = Object.values(blockErrors).some(Boolean)
      if (!silent && !hasError) {
        toast.add({
          title: "成功",
          description: "数据大屏已刷新",
          color: "success"
        })
      }
    } finally {
      refreshingAll.value = false
    }
  }

  async function updateTrendWindow(window: DashboardTrendWindow) {
    if (activeTrendWindow.value === window) {
      return
    }
    activeTrendWindow.value = window
    await fetchTrend()
  }

  async function changeBorrowPage(page: number) {
    recentEventsQuery.borrowPageNum = page
    await fetchRecentEvents()
  }

  async function changeOperPage(page: number) {
    recentEventsQuery.operPageNum = page
    await fetchRecentEvents()
  }

  async function changeAuthPage(page: number) {
    recentEventsQuery.authPageNum = page
    await fetchRecentEvents()
  }

  function formatDateTime(value?: string | Date | null) {
    return normalizeDateText(value)
  }

  function getOperResultColor(success?: number) {
    return normalizeNumber(success) === 1 ? "success" : "error"
  }

  function getOperResultLabel(success?: number) {
    return normalizeNumber(success) === 1 ? "成功" : "失败"
  }

  return {
    overview,
    trendPoints,
    rankings,
    recentEvents,
    recentEventsQuery,
    blockErrors,
    activeTrendWindow,
    trendWindowItems,
    trendCategories,
    businessTrendSeries,
    securityTrendSeries,
    lastUpdatedAt,
    loadingOverview,
    loadingTrend,
    loadingRanking,
    loadingRecentEvents,
    refreshingAll,
    refreshAll,
    updateTrendWindow,
    changeBorrowPage,
    changeOperPage,
    changeAuthPage,
    formatDateTime,
    getBorrowStatusLabel,
    getBorrowStatusColor,
    getOperResultColor,
    getOperResultLabel,
  }
}
