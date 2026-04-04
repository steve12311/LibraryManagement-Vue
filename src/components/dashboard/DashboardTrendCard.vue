<script setup lang="ts">
import { useResizeObserver } from "@vueuse/core"
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue"
import { init, use, type ECharts } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components"
import { LineChart } from "echarts/charts"

use([CanvasRenderer, GridComponent, LegendComponent, TooltipComponent, LineChart])

interface DashboardTrendSeriesItem {
  name: string
  data: number[]
  color: string
}

const props = defineProps<{
  title: string
  subtitle: string
  categories: string[]
  series: DashboardTrendSeriesItem[]
  loading?: boolean
  emptyText?: string
}>()

const chartElement = ref<HTMLDivElement>()
let chartInstance: ECharts | null = null
let themeObserver: MutationObserver | null = null

const hasData = computed(() => props.categories.length > 0 && props.series.length > 0)

function getChartOption() {
  const rootStyle = getComputedStyle(document.documentElement)
  const textMuted = rootStyle.getPropertyValue("--ui-text-muted").trim() || "#64748b"
  const textDefault = rootStyle.getPropertyValue("--ui-text").trim() || "#475569"
  const borderColor = rootStyle.getPropertyValue("--ui-border").trim() || "#cbd5e1"
  const elevatedColor = rootStyle.getPropertyValue("--ui-bg-elevated").trim() || "#e2e8f0"
  return {
    color: props.series.map((item) => item.color),
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(15, 23, 42, 0.88)",
      borderWidth: 0,
      textStyle: {
        color: "#f8fafc",
      },
    },
    legend: {
      top: 4,
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: textDefault,
      },
    },
    grid: {
      left: 12,
      right: 12,
      top: 46,
      bottom: 10,
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: props.categories,
      axisTick: {
        show: false,
      },
      axisLine: {
        lineStyle: {
          color: borderColor,
        },
      },
      axisLabel: {
        color: textMuted,
      },
    },
    yAxis: {
      type: "value",
      splitLine: {
        lineStyle: {
          color: elevatedColor,
        },
      },
      axisLabel: {
        color: textMuted,
      },
    },
    series: props.series.map((item) => ({
      name: item.name,
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 8,
      showSymbol: false,
      lineStyle: {
        width: 3,
      },
      emphasis: {
        focus: "series",
      },
      areaStyle: {
        opacity: 0.08,
      },
      data: item.data,
    })),
  }
}

function renderChart() {
  if (!chartElement.value || !hasData.value) {
    chartInstance?.dispose()
    chartInstance = null
    return
  }
  if (!chartInstance) {
    chartInstance = init(chartElement.value)
  }
  chartInstance.setOption(getChartOption(), true)
  chartInstance.resize()
}

useResizeObserver(chartElement, () => {
  chartInstance?.resize()
})

watch(
  () => [props.categories, props.series, props.loading],
  async () => {
    await nextTick()
    renderChart()
  },
  { deep: true }
)

onMounted(() => {
  themeObserver = new MutationObserver(() => {
    renderChart()
  })
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class", "data-theme", "data-color-mode"]
  })
  renderChart()
})

onBeforeUnmount(() => {
  themeObserver?.disconnect()
  themeObserver = null
  chartInstance?.dispose()
  chartInstance = null
})
</script>

<template>
  <UCard class="h-full rounded-2xl border border-default shadow-sm" :ui="{ body: 'p-5' }">
    <div class="flex items-start justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold text-highlighted">{{ title }}</h3>
        <p class="mt-1 text-sm text-muted">{{ subtitle }}</p>
      </div>
      <UIcon name="i-lucide-chart-column-big" class="mt-1 h-5 w-5 text-primary"/>
    </div>

    <div
      v-if="loading"
      class="mt-5 h-72 animate-pulse rounded-2xl border border-dashed border-default bg-elevated"
    />

    <div
      v-else-if="!hasData"
      class="mt-5 flex h-72 items-center justify-center rounded-2xl border border-dashed border-default bg-elevated text-sm text-muted"
    >
      {{ emptyText ?? '暂无趋势数据' }}
    </div>

    <div v-else ref="chartElement" class="mt-5 h-72 w-full"/>
  </UCard>
</template>
