<script setup lang="ts">
import type {StockPageVO} from '@/api/stock-api.ts'

const open = defineModel<boolean>('open', {default: false})
const currentSelectedStock = defineModel<StockPageVO | undefined>('stock')
</script>

<template>
  <UModal v-model:open="open" title="图书详情">
    <template #body>
      <div class="flex">
        <img style="max-width: 200px;object-fit: contain" :src="currentSelectedStock?.bookImage"
             :alt="currentSelectedStock?.name">
        <div>
          <p class="font-bold">{{ currentSelectedStock?.name }}</p>
          <p class="text-sm text-gray-500">作者：{{ currentSelectedStock?.author }}</p>
          <p class="text-sm text-gray-500">出版社：{{ currentSelectedStock?.publishName }}</p>
          <p class="text-sm text-gray-500">分类：{{ currentSelectedStock?.categoryName }}</p>
          <p class="text-sm mt-2">简介：{{ currentSelectedStock?.intro }}</p>
        </div>
      </div>
    </template>
  </UModal>
</template>
