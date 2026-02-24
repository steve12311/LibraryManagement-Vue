<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, useTemplateRef} from "vue";
import type {TableColumn} from "@nuxt/ui";
import categoryApi, {type CategoryQuery, type CategoryVO} from "@/api/category-api.ts";

const UButton = resolveComponent('UButton')

const categoryList = ref<CategoryVO[]>([])
const columns = ref<TableColumn<any>[]>([
  {
    accessorKey: "categoryId",
    header: "分类ID"
  },
  {
    accessorKey: "code",
    header: "分类代码"
  },
  {
    accessorKey: "categoryName",
    header: "分类名称",
    cell: ({row}) => {
      return h("div", {
        style: {
          paddingLeft: `${row.depth}rem`
        },
        class: 'flex items-center gap-2'
      }, [
        h(UButton, {
          icon: row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus',
          class: !row.getCanExpand() && 'invisible',
          size: 'xs',
          onClick: row.getToggleExpandedHandler()
        }),
        row.getValue('categoryName') as string
      ])
    }
  }
])
const columnVisibility = ref({
  categoryId: false
})
const table = useTemplateRef("table")
const query = reactive<CategoryQuery>({})

onMounted(() => {
  handleQuery()
})

function handleQuery() {
  categoryApi.getList(query)
      .then((data) => {
        categoryList.value = data
      })
      .catch((error) => {
        console.error(error)
      })
}
</script>

<template>
  <UCard>
    <template #header>
      <ActionGroup :table="table" @flush="handleQuery">
        <UForm @submit="handleQuery" class="w-full">
          <UInput v-model="query.categoryName" icon="i-lucide-search" size="md" variant="outline"
                  placeholder="请输入搜索内容..."/>
        </UForm>
      </ActionGroup>
    </template>
    <UTable ref="table" :column-visibility="columnVisibility" :data="categoryList" :columns="columns"
            :get-sub-rows="(row)=>row.children"
            :ui="{
      base: 'border-separate border-spacing-0',
      tbody: '[&>tr]:last:[&>td]:border-b-0',
      tr: 'group',
      td: 'empty:p-0 group-has-[td:not(:empty)]:border-b border-default'
    }"/>
  </UCard>
</template>

<style scoped>

</style>