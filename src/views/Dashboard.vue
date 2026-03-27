<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted } from "vue"
import DashboardMetricCard from "@/components/dashboard/DashboardMetricCard.vue"
import DashboardRankingCard from "@/components/dashboard/DashboardRankingCard.vue"
import DashboardRecentEventCard from "@/components/dashboard/DashboardRecentEventCard.vue"
import { useDashboardScreen } from "@/composables/dashboard/useDashboardScreen"

const DashboardTrendCard = defineAsyncComponent(
  () => import("@/components/dashboard/DashboardTrendCard.vue")
)

const {
  overview,
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
} = useDashboardScreen()

onMounted(() => {
  void refreshAll({ silent: true })
})

const collectionMetrics = computed(() => [
  {
    title: "图书总数",
    value: overview.value.bookTotal,
    description: "已建档图书品种总量",
    icon: "i-lucide-book-copy",
    tone: "sky" as const,
  },
  {
    title: "库存总量",
    value: overview.value.stockTotal,
    description: "全部在库副本总量",
    icon: "i-lucide-library-big",
    tone: "emerald" as const,
  },
  {
    title: "可借库存",
    value: overview.value.availableStockTotal,
    description: "当前可流通馆藏数量",
    icon: "i-lucide-circle-check-big",
    tone: "emerald" as const,
  },
])

const circulationMetrics = computed(() => [
  {
    title: "借阅中",
    value: overview.value.borrowingTotal,
    description: "当前仍在借阅流程中的副本",
    icon: "i-lucide-book-up-2",
    tone: "sky" as const,
  },
  {
    title: "已归还",
    value: overview.value.returnedTotal,
    description: "累计完成归还的记录量",
    icon: "i-lucide-book-check",
    tone: "emerald" as const,
  },
  {
    title: "已逾期",
    value: overview.value.overdueTotal,
    description: "需要重点催还的记录量",
    icon: "i-lucide-triangle-alert",
    tone: "amber" as const,
  },
  {
    title: "启用用户",
    value: overview.value.enabledUserTotal,
    description: "当前可正常登录与借阅的用户",
    icon: "i-lucide-users",
    tone: "violet" as const,
  },
])

const securityMetrics = computed(() => [
  {
    title: "今日登录成功",
    value: overview.value.todayLoginSuccessCount,
    description: "认证成功次数",
    icon: "i-lucide-log-in",
    tone: "emerald" as const,
  },
  {
    title: "今日登录失败",
    value: overview.value.todayLoginFailureCount,
    description: "需关注的异常认证次数",
    icon: "i-lucide-shield-alert",
    tone: "rose" as const,
  },
  {
    title: "今日操作成功",
    value: overview.value.todayOperSuccessCount,
    description: "后台写操作成功次数",
    icon: "i-lucide-badge-check",
    tone: "sky" as const,
  },
  {
    title: "今日操作失败",
    value: overview.value.todayOperFailureCount,
    description: "后台写操作失败次数",
    icon: "i-lucide-badge-x",
    tone: "amber" as const,
  },
])
</script>

<template>
  <div class="page-scroll h-full overflow-y-auto overflow-x-hidden rounded-2xl border border-default bg-slate-50/70">
    <div class="mx-auto flex max-w-[1600px] flex-col gap-6 px-4 py-6 lg:px-6">
      <section class="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <UCard class="rounded-3xl border border-default bg-gradient-to-br from-cyan-50 via-white to-sky-50 shadow-sm" :ui="{ body: 'p-6 lg:p-7' }">
          <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div class="space-y-3">
              <div class="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/80 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-cyan-700">
                <UIcon name="i-lucide-chart-column-big" class="h-4 w-4"/>
                DATA COCKPIT
              </div>
              <div>
                <h1 class="text-3xl font-bold tracking-tight text-highlighted">校园图书馆数据大屏</h1>
                <p class="mt-2 max-w-3xl text-sm leading-6 text-muted">
                  面向后台管理员的运营驾驶舱，集中查看馆藏、借阅、操作审计与认证风险的关键指标。
                </p>
              </div>
            </div>
            <div class="grid gap-3 rounded-2xl border border-cyan-100 bg-white/80 p-4 text-sm text-slate-600 shadow-sm sm:grid-cols-2">
              <div>
                <p class="text-xs uppercase tracking-[0.2em] text-muted">当前窗口</p>
                <p class="mt-1 font-medium text-highlighted">
                  {{ trendWindowItems.find((item) => item.value === activeTrendWindow)?.label || "-" }}
                </p>
              </div>
              <div>
                <p class="text-xs uppercase tracking-[0.2em] text-muted">最后刷新</p>
                <p class="mt-1 font-medium text-highlighted">{{ lastUpdatedAt || "-" }}</p>
              </div>
              <div class="sm:col-span-2 flex justify-end">
                <UButton
                  icon="i-lucide-refresh-cw"
                  :loading="refreshingAll"
                  @click="refreshAll()"
                >
                  手动刷新
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <UCard class="rounded-3xl border border-default shadow-sm" :ui="{ body: 'p-6' }">
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="text-xs font-semibold tracking-[0.24em] text-muted">观察重点</p>
              <h2 class="mt-2 text-xl font-semibold text-highlighted">今日异常与运营摘要</h2>
            </div>
            <UIcon name="i-lucide-scan-eye" class="h-5 w-5 text-cyan-600"/>
          </div>
          <div class="mt-5 grid gap-3">
            <div class="rounded-2xl border border-rose-100 bg-rose-50/60 p-4">
              <p class="text-sm font-medium text-rose-700">登录失败需关注</p>
              <p class="mt-2 text-3xl font-bold text-rose-900">{{ overview.todayLoginFailureCount }}</p>
              <p class="mt-1 text-xs text-rose-700/80">今日登录失败次数</p>
            </div>
            <div class="rounded-2xl border border-amber-100 bg-amber-50/60 p-4">
              <p class="text-sm font-medium text-amber-700">逾期催还压力</p>
              <p class="mt-2 text-3xl font-bold text-amber-900">{{ overview.overdueTotal }}</p>
              <p class="mt-1 text-xs text-amber-700/80">当前逾期记录数量</p>
            </div>
            <div class="rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
              <p class="text-sm font-medium text-sky-700">后台写操作压力</p>
              <p class="mt-2 text-3xl font-bold text-sky-900">{{ overview.todayOperSuccessCount + overview.todayOperFailureCount }}</p>
              <p class="mt-1 text-xs text-sky-700/80">今日后台写操作总次数</p>
            </div>
          </div>
        </UCard>
      </section>

      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-highlighted">总览指标</h2>
            <p class="text-sm text-muted">按馆藏、流通和安全三组查看当前全局状态。</p>
          </div>
          <p v-if="blockErrors.overview" class="text-sm text-error">{{ blockErrors.overview }}</p>
        </div>

        <div class="space-y-5">
          <div>
            <p class="mb-3 text-xs font-semibold tracking-[0.24em] text-muted">馆藏基础</p>
            <div v-if="loadingOverview" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div
                v-for="item in 3"
                :key="`collection-loading-${item}`"
                class="h-36 animate-pulse rounded-2xl border border-dashed border-default bg-elevated"
              />
            </div>
            <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <DashboardMetricCard
                v-for="item in collectionMetrics"
                :key="item.title"
                v-bind="item"
              />
            </div>
          </div>

          <div>
            <p class="mb-3 text-xs font-semibold tracking-[0.24em] text-muted">借阅流通</p>
            <div v-if="loadingOverview" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div
                v-for="item in 4"
                :key="`circulation-loading-${item}`"
                class="h-36 animate-pulse rounded-2xl border border-dashed border-default bg-elevated"
              />
            </div>
            <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DashboardMetricCard
                v-for="item in circulationMetrics"
                :key="item.title"
                v-bind="item"
              />
            </div>
          </div>

          <div>
            <p class="mb-3 text-xs font-semibold tracking-[0.24em] text-muted">账号与安全</p>
            <div v-if="loadingOverview" class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div
                v-for="item in 4"
                :key="`security-loading-${item}`"
                class="h-36 animate-pulse rounded-2xl border border-dashed border-default bg-elevated"
              />
            </div>
            <div v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <DashboardMetricCard
                v-for="item in securityMetrics"
                :key="item.title"
                v-bind="item"
              />
            </div>
          </div>
        </div>
      </section>

      <section class="grid gap-4 2xl:grid-cols-[1.35fr_0.65fr]">
        <div class="space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">趋势分析</h2>
              <p class="text-sm text-muted">固定窗口切换，不开放自由参数输入。</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="item in trendWindowItems"
                :key="item.value"
                size="sm"
                :variant="activeTrendWindow === item.value ? 'solid' : 'soft'"
                :color="activeTrendWindow === item.value ? 'primary' : 'neutral'"
                @click="updateTrendWindow(item.value)"
              >
                {{ item.label }}
              </UButton>
            </div>
          </div>
          <p v-if="blockErrors.trend" class="text-sm text-error">{{ blockErrors.trend }}</p>

          <div class="grid gap-4 xl:grid-cols-2">
            <DashboardTrendCard
              title="借阅流通趋势"
              subtitle="重点观察借阅中、已归还、逾期三类业务走势。"
              :categories="trendCategories"
              :series="businessTrendSeries"
              :loading="loadingTrend"
              empty-text="当前时间窗口内暂无借阅流通趋势数据"
            />
            <DashboardTrendCard
              title="安全与操作趋势"
              subtitle="同步查看登录与后台写操作的成功/失败波动。"
              :categories="trendCategories"
              :series="securityTrendSeries"
              :loading="loadingTrend"
              empty-text="当前时间窗口内暂无认证与操作趋势数据"
            />
          </div>
        </div>

        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-semibold text-highlighted">排行观察</h2>
              <p class="text-sm text-muted">按近 24 小时 / 近 30 天口径查看重点 Top 榜单。</p>
            </div>
          </div>
          <p v-if="blockErrors.ranking" class="text-sm text-error">{{ blockErrors.ranking }}</p>

          <div class="space-y-4">
            <DashboardRankingCard
              title="热门借阅图书"
              subtitle="近 30 天借阅热度 Top5"
              mode="book"
              :items="rankings.hotBooks"
              :loading="loadingRanking"
            />
            <DashboardRankingCard
              title="操作模块 Top5"
              subtitle="近 24 小时后台写操作模块分布"
              mode="count"
              :items="rankings.operationModules"
              :loading="loadingRanking"
            />
            <DashboardRankingCard
              title="登录失败用户名 Top5"
              subtitle="近 24 小时认证失败用户名分布"
              mode="count"
              :items="rankings.authFailureUsers"
              :loading="loadingRanking"
            />
            <DashboardRankingCard
              title="登录失败 IP Top5"
              subtitle="近 24 小时认证失败来源 IP 分布"
              mode="count"
              :items="rankings.authFailureIps"
              :loading="loadingRanking"
            />
          </div>
        </div>
      </section>

      <section class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-lg font-semibold text-highlighted">最近事件</h2>
            <p class="text-sm text-muted">三类事件同时可见，翻页互不影响。</p>
          </div>
          <p v-if="blockErrors.recentEvents" class="text-sm text-error">{{ blockErrors.recentEvents }}</p>
        </div>

        <div class="grid gap-4 xl:grid-cols-3">
          <DashboardRecentEventCard
            title="最近借阅"
            subtitle="优先关注借阅中与逾期记录"
            kind="borrow"
            :loading="loadingRecentEvents"
            :items="recentEvents.borrows.list"
            :total="recentEvents.borrows.total"
            :page="recentEventsQuery.borrowPageNum"
            :page-size="recentEventsQuery.borrowPageSize"
            empty-text="暂无借阅事件"
            @page-change="changeBorrowPage"
          />
          <DashboardRecentEventCard
            title="最近操作日志"
            subtitle="聚焦后台关键写操作结果"
            kind="oper"
            :loading="loadingRecentEvents"
            :items="recentEvents.operLogs.list"
            :total="recentEvents.operLogs.total"
            :page="recentEventsQuery.operPageNum"
            :page-size="recentEventsQuery.operPageSize"
            empty-text="暂无操作日志"
            @page-change="changeOperPage"
          />
          <DashboardRecentEventCard
            title="最近认证失败"
            subtitle="用于快速观察异常登录来源"
            kind="auth"
            :loading="loadingRecentEvents"
            :items="recentEvents.authFailures.list"
            :total="recentEvents.authFailures.total"
            :page="recentEventsQuery.authPageNum"
            :page-size="recentEventsQuery.authPageSize"
            empty-text="暂无认证失败记录"
            @page-change="changeAuthPage"
          />
        </div>
      </section>
    </div>
  </div>
</template>
