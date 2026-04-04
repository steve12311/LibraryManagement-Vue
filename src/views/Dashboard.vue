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
  <div class="page-scroll h-full overflow-y-auto overflow-x-hidden">
    <div class="mx-auto flex max-w-[1600px] flex-col gap-5 px-1 py-1">
      <section class="space-y-4">
        <UCard class="system-page-card" :ui="{ body: 'p-6 lg:p-7' }">
          <div class="page-header">
            <div class="page-copy">
              <p class="page-kicker">OPERATIONS INSIGHT</p>
              <h1 class="page-title">数据分析</h1>
              <p class="page-description">集中查看馆藏、借阅、操作审计与认证风险的关键指标，用于日常巡检与趋势判断。</p>
            </div>

            <div class="page-stats page-stats-compact">
              <div class="stat-item">
                <span class="stat-label">当前窗口</span>
                <strong class="stat-value stat-value--sm">
                  {{ trendWindowItems.find((item) => item.value === activeTrendWindow)?.label || "-" }}
                </strong>
              </div>
              <div class="stat-item">
                <span class="stat-label">最后刷新</span>
                <strong class="stat-value stat-value--sm">{{ lastUpdatedAt || "-" }}</strong>
              </div>
              <div class="stat-actions">
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

        <UCard class="summary-card" :ui="{ body: 'p-6' }">
          <div class="section-header">
            <div>
              <p class="section-kicker">异常摘要</p>
              <h2 class="section-title">今日需重点关注</h2>
              <p class="section-description">快速扫描认证风险、逾期压力与后台写操作负载。</p>
            </div>
            <UIcon name="i-lucide-scan-eye" class="h-5 w-5 text-muted"/>
          </div>
          <div class="summary-grid">
            <div class="summary-item summary-item--rose">
              <p class="text-sm font-medium text-rose-700">登录失败</p>
              <p class="mt-2 text-2xl font-bold text-rose-900">{{ overview.todayLoginFailureCount }}</p>
              <p class="mt-1 text-xs text-rose-700/80">今日失败次数</p>
            </div>
            <div class="summary-item summary-item--amber">
              <p class="text-sm font-medium text-amber-700">逾期记录</p>
              <p class="mt-2 text-2xl font-bold text-amber-900">{{ overview.overdueTotal }}</p>
              <p class="mt-1 text-xs text-amber-700/80">当前待催还数量</p>
            </div>
            <div class="summary-item summary-item--sky">
              <p class="text-sm font-medium text-sky-700">后台写操作</p>
              <p class="mt-2 text-2xl font-bold text-sky-900">{{ overview.todayOperSuccessCount + overview.todayOperFailureCount }}</p>
              <p class="mt-1 text-xs text-sky-700/80">今日总操作次数</p>
            </div>
          </div>
        </UCard>
      </section>

      <section class="space-y-4">
        <div class="section-header">
          <div>
            <p class="section-kicker">关键指标</p>
            <h2 class="section-title">关键指标总览</h2>
            <p class="section-description">按馆藏、流通和安全三组查看当前运行状态。</p>
          </div>
          <p v-if="blockErrors.overview" class="text-sm text-error">{{ blockErrors.overview }}</p>
        </div>

        <div class="space-y-5">
          <div>
            <p class="group-label">馆藏基础</p>
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
            <p class="group-label">借阅流通</p>
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
            <p class="group-label">账号与安全</p>
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
          <div class="section-header">
            <div>
              <p class="section-kicker">趋势分析</p>
              <h2 class="section-title">趋势分析</h2>
              <p class="section-description">按固定时间窗口查看业务与安全走势。</p>
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
          <div class="section-header">
            <div>
              <p class="section-kicker">排行观察</p>
              <h2 class="section-title">排行观察</h2>
              <p class="section-description">按固定统计口径查看重点排行结果。</p>
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
        <div class="section-header">
          <div>
            <p class="section-kicker">最近记录</p>
            <h2 class="section-title">最近记录</h2>
            <p class="section-description">三类记录同时可见，翻页互不影响。</p>
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

<style scoped>
.page-scroll {
  border-radius: 28px;
}

.system-page-card,
.summary-card {
  border: 0;
  border-radius: 28px;
  background: rgb(255 255 255 / 96%);
  box-shadow: var(--library-shadow-soft);
}

.page-header,
.section-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-kicker,
.section-kicker,
.group-label,
.stat-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--library-accent);
}

.page-title {
  margin-top: 6px;
  font-size: 30px;
  font-weight: 800;
  color: var(--library-text);
}

.section-title {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 800;
  color: var(--library-text);
}

.page-description,
.section-description {
  margin-top: 8px;
  font-size: 14px;
  color: var(--library-text-muted);
}

.page-stats {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-width: min(100%, 360px);
}

.page-stats-compact {
  align-items: stretch;
}

.stat-item {
  border-radius: 18px;
  padding: 14px 16px;
  background: var(--library-card-muted);
}

.stat-value {
  display: block;
  margin-top: 6px;
  font-size: 24px;
  font-weight: 800;
  color: var(--library-text);
}

.stat-value--sm {
  font-size: 15px;
  line-height: 1.5;
}

.stat-actions {
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}

.summary-grid {
  display: grid;
  gap: 12px;
  margin-top: 20px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-item {
  border-radius: 20px;
  padding: 16px;
}

.summary-item--rose {
  border: 1px solid rgb(255 228 230);
  background: rgb(255 241 242 / 72%);
}

.summary-item--amber {
  border: 1px solid rgb(254 243 199);
  background: rgb(255 251 235 / 72%);
}

.summary-item--sky {
  border: 1px solid rgb(224 242 254);
  background: rgb(240 249 255 / 72%);
}

.group-label {
  margin-bottom: 12px;
}

@media (max-width: 1280px) {
  .summary-grid,
  .page-stats {
    grid-template-columns: 1fr;
  }

  .stat-actions {
    justify-content: flex-start;
  }
}
</style>
