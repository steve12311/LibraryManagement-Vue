<script setup lang="ts">
import type {StockPageVO} from '@/api/library/stock-api.ts'

const open = defineModel<boolean>('open', {default: false})
const currentSelectedStock = defineModel<StockPageVO | undefined>('stock')
</script>

<template>
  <UModal v-model:open="open"
          title="图书详情"
          :ui="{
          content: 'sm:max-w-xl'
          }"
  >
    <template #body>
      <div class="flex">
        <img style="max-width: 200px;object-fit: contain;margin: 0 12px" :src="currentSelectedStock?.bookImage"
             :alt="currentSelectedStock?.name">
        <div>
          <p class="font-bold">{{ currentSelectedStock?.name }}</p>
          <p class="text-sm text-muted">作者：{{ currentSelectedStock?.author }}</p>
          <p class="text-sm text-muted">出版社：{{ currentSelectedStock?.publishName }}</p>
          <p class="text-sm text-muted">分类：{{ currentSelectedStock?.categoryName }}</p>
          <p class="text-sm text-muted">书架：{{ currentSelectedStock?.shelfNo || "未绑定" }}</p>
          <p class="text-sm text-muted">价格：¥ {{ currentSelectedStock?.price }}</p>
          <p class="text-sm mt-2">简介：{{ currentSelectedStock?.intro }}</p>
        </div>
      </div>
    </template>
  </UModal>
</template>
