<script setup lang="ts">
import {h, onMounted, reactive, ref, useTemplateRef} from "vue";
import type {SelectItem, TableColumn, TableRow} from "@nuxt/ui";
import moment from "moment/moment";
import stockApi, {type StockPageVO, type StockQuery} from "../api/stock-api.ts";
import FileApi from "../api/file-api.ts";
import {type UIMessage} from 'ai'
import {getTextFromMessage} from "@nuxt/ui/utils/ai";
import {AIChat} from "../utils/Chat.ts";
import Markdown from "markstream-vue"

onMounted(() => {
  handleQuery()
})

const chat = new AIChat({})
const pageDate = ref<StockPageVO[]>([])
const currentSelectedStock = ref<StockPageVO>()
const fieldItems = ref<SelectItem[]>([
  {
    label: "名称",
    value: "name"
  },
  {
    label: "作者",
    value: "author"
  },
  {
    label: "ISBN",
    value: "isbn"
  }
])
const total = ref(0);
const open = ref(false)
const openAISidebar = ref(false)
const queryParams = reactive<StockQuery>({
  pageNum: 1,
  pageSize: 10,
  field: "name"
})
const inputMessage = ref("")
const table = useTemplateRef("table")
const columns = ref<TableColumn<any>[]>([
  {
    id: "bookImage",
    accessorKey: "bookImage",
    header: "封面",
    cell: ({row}) => {
      return h("div", {
        style: {
          height: "120px",
        }
      }, [
        h("img", {
          src: row.original.bookImage,
          style: {
            height: "100%",
          }
        }, undefined)
      ])
    }
  },
  {
    id: "isbn",
    accessorKey: "isbn",
    header: "ISBN"
  },
  {
    id: "name",
    accessorKey: "name",
    header: "名称"
  },
  {
    id: "author",
    accessorKey: "author",
    header: "作者",
  },
  {
    id: "publishName",
    accessorKey: "publishName",
    header: "出版社"
  },
  {
    id: "stock",
    header: "库存",
    cell: ({row}) => h('div', undefined, [
      h('span', {class: ''}, `${row.original.currentNumber}/`),
      h('span', {class: 'font-medium text-highlighted'}, row.original.stockNumber)
    ]),
  },
  {
    id: "createTime",
    accessorKey: "createTime",
    header: "入库日期",
    cell: ({row}) => moment(row.original.createTime).format("YYYY-MM-DD HH:mm:ss"),
  }
])
const copied = ref(false)

// 查询（重置页码后获取数据）
function handleQuery() {
  queryParams.pageNum = 1;
  fetchData();
}

function showBookDetailInfo(_: any, row: TableRow<StockPageVO>) {
  open.value = true
  currentSelectedStock.value = row.original
}

async function fetchData() {
  try {
    const data = await stockApi.getPage(queryParams)
    pageDate.value = data.list
    total.value = data.total
    for (const item of pageDate.value) {
      item.bookImage = await fetchImage(item.bookImage)
    }
  } catch (e) {
    console.log(e)
  }
}

async function fetchImage(originalUrl: string | undefined) {
  if (originalUrl) {
    const blob = await FileApi.getFile(originalUrl)
    return URL.createObjectURL(blob.data)
  }
}

function sendMessage(e: Event) {
  e.preventDefault()
  if (inputMessage.value.trim() === "") {
    return;
  }
  chat.sendMessage(inputMessage.value)
  inputMessage.value = ""
}

async function copy(_: MouseEvent, message: UIMessage) {
  console.log(message)
  await navigator.clipboard.writeText(getTextFromMessage(message))
  copied.value = true

  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <UButton class="absolute z-10 right-10 bottom-10" icon="i-lucide-bot" label="智慧咨询" @click="openAISidebar = true"/>
  <USlideover title="智慧咨询" v-model:open="openAISidebar">
    <template #body>
      <UContainer class="flex flex-col gap-4 sm:gap-6" style="min-height: 100%;padding: 0">
        <UPageCard class="flex-1" spotlight
                   spotlight-color="primary"
                   v-if="chat.messages.value && chat.messages.value.length === 0"
                   title="欢迎使用智慧书籍查询"
        />
        <UChatMessages
            v-else
            :should-auto-scroll="true"
            :status="chat.status.value"
            :user="{
        variant: 'solid',
      }"
            :assistant="{
        side:'left',
        variant:'outline',
        avatar:{
          icon:'i-lucide-bot'
        },
        actions: [
        {
          label: 'Copy to clipboard',
          icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy',
          onClick: copy
        }
      ]}"
            :messages="chat.messages.value"
        >
          <template #content="{ message }">
            <Markdown
                v-if="message.role === 'assistant'"
                :content="message.parts?.filter(p => p.type === 'text').map(p => p.text).join('') || ''"
                class="*:first:mt-0 *:last:mb-0"
            />
            <div
                v-else-if="message.role === 'user'"
                class="whitespace-pre-wrap wrap-break-word"
                v-text="message.parts?.filter(p => p.type === 'text').map(p => p.text).join('') || ''"
            />
          </template>

          <template #indicator>
            <UButton
                class="px-0"
                color="neutral"
                variant="link"
                loading
                loading-icon="i-lucide-loader"
                label="思考中..."
            />
          </template>
        </UChatMessages>
        <UChatPrompt v-model="inputMessage" variant="subtle"
                     class="sticky bottom-0 [view-transition-name:chat-prompt] z-10"
                     @submit="sendMessage">
          <template #footer>
            <div></div>
            <UChatPromptSubmit @reload="chat.reload()" @stop="chat.stop()" :status="chat.status.value" color="neutral"
                               size="sm"/>
          </template>
        </UChatPrompt>
      </UContainer>
    </template>
  </USlideover>
  <UModal v-model:open="open" title="图书详情">
    <template #body>
      <div class="flex">
        <img class="h-fit" :src="currentSelectedStock?.bookImage" :alt="currentSelectedStock?.name">
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
  <UCard>
    <template #header>
      <ActionGroup @flush="fetchData" :table="table">
        <UForm @submit="fetchData" class="w-full">
          <div class="flex gap-2">
            <USelect v-model="queryParams.field" defaultValue="name" :items="fieldItems" class="w-48"/>
            <UInput v-model="queryParams.keyword" icon="i-lucide-search" size="md" variant="outline"
                    placeholder="请输入搜索内容..."/>
          </div>
        </UForm>
        <template #behind>
          <UButton label="入库"/>
        </template>
      </ActionGroup>
    </template>
    <UTable ref="table" :columns="columns" :data="pageDate" @select="showBookDetailInfo"/>
    <template #footer>
      <div class="flex justify-center border-default pt-4">
        <UPagination v-model:page="queryParams.pageNum" :total="total"
                     :items-per-page="queryParams.pageSize" @update:page="fetchData"
        />
      </div>
    </template>
  </UCard>
</template>

<style scoped>

</style>