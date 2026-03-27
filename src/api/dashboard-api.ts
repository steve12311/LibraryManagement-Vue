import request from "@/utils/request"
import type { BorrowStatusValue } from "@/enums/system/borrow-status-enum"

const DASHBOARD_BASE_URL = "/api/v1/dashboard"

export type DashboardTrendMode = "day" | "hour"

export interface DashboardOverview {
  bookTotal: number
  stockTotal: number
  availableStockTotal: number
  borrowingTotal: number
  returnedTotal: number
  overdueTotal: number
  enabledUserTotal: number
  todayLoginSuccessCount: number
  todayLoginFailureCount: number
  todayOperSuccessCount: number
  todayOperFailureCount: number
}

export interface DashboardTrendQuery {
  mode: DashboardTrendMode
  days?: 7 | 30
  hours?: 24
}

export interface DashboardTrendPoint {
  timeBucket: string
  label: string
  bookTotal: number
  stockTotal: number
  availableStockTotal: number
  borrowingTotal: number
  returnedTotal: number
  overdueTotal: number
  enabledUserTotal: number
  loginSuccessCount: number
  loginFailureCount: number
  operSuccessCount: number
  operFailureCount: number
}

export interface DashboardNamedCountItem {
  name: string
  count: number
}

export interface DashboardHotBook {
  isbn: string
  bookName: string
  cover: string
  count: number
}

export interface DashboardRankings {
  hotBooks: DashboardHotBook[]
  operationModules: DashboardNamedCountItem[]
  authFailureUsers: DashboardNamedCountItem[]
  authFailureIps: DashboardNamedCountItem[]
}

export interface DashboardListBlock<T> {
  list: T[]
  total: number
}

export interface DashboardRecentBorrow {
  borrowId: string
  isbn: string
  cover: string
  bookName: string
  username: string
  returnTime?: string | Date
  status: BorrowStatusValue
  createTime?: string | Date
}

export interface DashboardRecentOperLog {
  logId: number
  module: string
  action: string
  operatorUsername: string
  success: 0 | 1
  resultCode: string
  createTime?: string | Date
}

export interface DashboardRecentAuthLog {
  logId: number
  eventType: string
  username: string
  clientIp: string
  resultCode: string
  failureSummary: string
  createTime?: string | Date
}

export interface DashboardRecentEvents {
  borrows: DashboardListBlock<DashboardRecentBorrow>
  operLogs: DashboardListBlock<DashboardRecentOperLog>
  authFailures: DashboardListBlock<DashboardRecentAuthLog>
}

export interface DashboardRecentEventsQuery {
  borrowPageNum: number
  borrowPageSize: number
  operPageNum: number
  operPageSize: number
  authPageNum: number
  authPageSize: number
}

const DashboardApi = {
  getOverview() {
    return request<unknown, DashboardOverview>({
      url: `${DASHBOARD_BASE_URL}/overview`,
      method: "get",
    })
  },
  getTrends(queryParams: DashboardTrendQuery) {
    return request<unknown, DashboardTrendPoint[]>({
      url: `${DASHBOARD_BASE_URL}/trends`,
      method: "get",
      params: queryParams,
    })
  },
  getRankings() {
    return request<unknown, DashboardRankings>({
      url: `${DASHBOARD_BASE_URL}/rankings`,
      method: "get",
    })
  },
  getRecentEvents(queryParams: DashboardRecentEventsQuery) {
    return request<unknown, DashboardRecentEvents>({
      url: `${DASHBOARD_BASE_URL}/recent-events`,
      method: "get",
      params: queryParams,
    })
  },
}

export default DashboardApi
