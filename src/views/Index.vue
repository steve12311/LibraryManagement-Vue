<script setup lang="ts">
import {computed, defineAsyncComponent, onMounted, reactive, ref, watch} from "vue";
import publicBookApi, {type PublicBookPageVO, type PublicBookQuery} from "@/api/public-book-api";
import FileApi from "@/api/file-api.ts";

interface HomeBookCard extends PublicBookPageVO {
  coverPreview?: string;
}

const AISidebar = defineAsyncComponent(() => import("@/components/AISidebar.vue"))

const toast = useToast()
const openAISidebar = ref(false)
const aiSidebarLoaded = ref(false)
const loading = ref(false)
const total = ref(0)
const searchKeyword = ref("")
const activeKeyword = ref("")
const books = ref<HomeBookCard[]>([])
const fetchSerial = ref(0)
const queryParams = reactive<PublicBookQuery>({
  pageNum: 1,
  pageSize: 9,
  field: "name",
  keyword: void 0
})
const imageCache = new Map<string, string>()
const aiHighlights = [
  {icon: "i-lucide-book-open-check", text: "支持按书名快速定位馆藏"},
  {icon: "i-lucide-lightbulb", text: "可询问借阅建议与阅读路线"},
  {icon: "i-lucide-clock-3", text: "随时打开，无需跳转页面"}
]

const resultText = computed(() => {
  if (!activeKeyword.value) {
    return `当前共收录 ${total.value} 本图书`
  }
  return `关键词“${activeKeyword.value}”共找到 ${total.value} 本图书`
})

onMounted(() => {
  void fetchBooks()
})

watch(openAISidebar, (isOpen) => {
  if (isOpen) {
    aiSidebarLoaded.value = true
  }
})

function normalizeKeyword(value: string) {
  const normalized = value.trim()
  return normalized.length > 0 ? normalized : void 0
}

function handleSearch() {
  queryParams.pageNum = 1
  queryParams.keyword = normalizeKeyword(searchKeyword.value)
  activeKeyword.value = queryParams.keyword ?? ""
  void fetchBooks()
}

function clearSearch() {
  if (!searchKeyword.value && !activeKeyword.value) {
    return
  }
  queryParams.pageNum = 1
  queryParams.keyword = void 0
  searchKeyword.value = ""
  activeKeyword.value = ""
  void fetchBooks()
}

function handlePageChange(page: number) {
  queryParams.pageNum = page
  void fetchBooks()
}

function openAiAssistant() {
  aiSidebarLoaded.value = true
  openAISidebar.value = true
}

async function fetchBooks() {
  const currentFetchSerial = ++fetchSerial.value
  try {
    loading.value = true
    const data = await publicBookApi.getPage({
      ...queryParams,
      keyword: queryParams.keyword
    })
    if (currentFetchSerial !== fetchSerial.value) return
    total.value = data.total
    books.value = data.list.map((book) => {
      return {
        ...book,
        coverPreview: fetchCover(book.coverUrl)
      }
    })
  } catch (error) {
    if (currentFetchSerial !== fetchSerial.value) return
    console.error(error)
    books.value = []
    total.value = 0
    toast.add({title: "错误", description: "图书数据加载失败", color: "error"})
  } finally {
    if (currentFetchSerial === fetchSerial.value) {
      loading.value = false
    }
  }
}

function fetchCover(coverUrl?: string) {
  if (!coverUrl) {
    return void 0
  }
  const cachedUrl = imageCache.get(coverUrl)
  if (cachedUrl) {
    return cachedUrl
  }
  const resolvedUrl = FileApi.resolveUrl(coverUrl)
  if (!resolvedUrl) {
    return void 0
  }
  imageCache.set(coverUrl, resolvedUrl)
  return resolvedUrl
}

function formatDate(date?: Date | string) {
  if (!date) {
    return "未知日期"
  }
  const currentDate = new Date(date)
  if (Number.isNaN(currentDate.getTime())) {
    return "未知日期"
  }
  return currentDate.toLocaleDateString("zh-CN")
}

function getAvailabilityLabel(book: HomeBookCard) {
  return book.available ? "可借" : "无库存"
}

function getAvailabilityColor(book: HomeBookCard) {
  return book.available ? "success" : "error"
}
</script>

<template>
  <div class="relative flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-default bg-slate-50/70">

    <div class="page-scroll relative min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
      <div class="mx-auto flex min-h-full max-w-7xl flex-col gap-7 px-4 py-8 lg:px-10">
        <section class="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <UCard class="hero-panel rounded-2xl border border-default bg-default shadow-sm" :ui="{ body: 'p-6' }">
            <p class="text-xs font-semibold tracking-[0.25em] text-muted">
              SMART LIBRARY
            </p>
            <h1 class="mt-3 text-3xl font-bold leading-tight text-highlighted">
              只用一个搜索框，快速找到你要的图书
            </h1>
            <p class="mt-2 text-sm text-muted">
              输入书名后按回车或点击搜索，即可查看公开书目信息与可借状态。
            </p>
            <form class="mt-6 flex flex-col gap-3 sm:flex-row" @submit.prevent="handleSearch">
              <UInput
                  v-model="searchKeyword"
                  icon="i-lucide-search"
                  size="xl"
                  class="w-full flex-1"
                  placeholder="例如：活着、三体、数据结构"
              />
              <div class="flex gap-2">
                <UButton type="submit" size="xl" icon="i-lucide-search" :loading="loading">
                  搜索图书
                </UButton>
                <UButton
                    v-if="activeKeyword"
                    size="xl"
                    variant="soft"
                    color="neutral"
                    icon="i-lucide-rotate-ccw"
                    @click="clearSearch"
                >
                  清空
                </UButton>
              </div>
            </form>
            <p class="mt-4 text-sm text-muted">{{ resultText }}</p>
          </UCard>

          <UCard class="ai-panel rounded-2xl border border-cyan-100/80 bg-cyan-50/50 shadow-sm" :ui="{ body: 'p-5' }">
            <div class="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/85 px-3 py-1 text-xs font-medium text-cyan-700">
              <UIcon name="i-lucide-bot" class="h-4 w-4"/>
              智慧咨询
            </div>
            <h2 class="mt-4 text-xl font-semibold text-highlighted">
              不知道读什么？让助手帮你
            </h2>
            <p class="mt-2 text-sm text-muted">
              首页检索找到书，侧边栏继续问推荐、主题阅读和借阅建议。
            </p>
            <div class="mt-4 space-y-2">
              <div
                  v-for="item in aiHighlights"
                  :key="item.text"
                  class="flex items-center gap-2 rounded-lg border border-cyan-100/80 bg-white/80 px-3 py-2 text-sm text-gray-700"
              >
                <UIcon :name="item.icon" class="h-4 w-4 text-cyan-600"/>
                <span>{{ item.text }}</span>
              </div>
            </div>
            <UButton class="mt-5" icon="i-lucide-sparkles" color="primary" variant="soft" @click="openAiAssistant">
              打开智慧咨询
            </UButton>
          </UCard>
        </section>

        <section>
          <div v-if="loading" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <UCard
                v-for="item in queryParams.pageSize"
                :key="item"
                class="h-52 animate-pulse rounded-2xl border border-default bg-default"
                :ui="{ body: 'h-full p-0' }"
            />
          </div>

          <UCard
              v-else-if="books.length === 0"
              class="rounded-2xl border border-dashed border-default bg-default text-center"
              :ui="{ body: 'p-14' }"
          >
            <p class="text-lg font-semibold text-highlighted">没有找到相关图书</p>
            <p class="mt-2 text-sm text-muted">可以换一个更短或更准确的书名再次搜索。</p>
          </UCard>

          <div v-else class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <UCard
                v-for="(book, index) in books"
                :key="book.isbn"
                class="book-card h-full border-default transition duration-300 hover:-translate-y-1 hover:shadow-md"
                :style="{ '--book-delay': `${index * 40}ms` }"
            >
              <div class="flex gap-4">
                <div class="h-28 w-20 shrink-0 overflow-hidden rounded-lg border border-default bg-elevated">
                  <img
                      v-if="book.coverPreview"
                      :src="book.coverPreview"
                      :alt="book.name"
                      class="h-full w-full object-cover"
                  >
                  <div
                      v-else
                      class="flex h-full w-full items-center justify-center px-2 text-center text-xs text-muted"
                  >
                    暂无封面
                  </div>
                </div>
                <div class="min-w-0 flex-1 space-y-2">
                  <p class="book-title text-base font-semibold text-highlighted">{{ book.name }}</p>
                  <p class="text-sm text-muted">作者：{{ book.author || "未知" }}</p>
                  <p class="text-sm text-muted">出版社：{{ book.publishName || "未知" }}</p>
                  <div class="flex items-center gap-2">
                    <UBadge :color="getAvailabilityColor(book)" variant="subtle">{{ getAvailabilityLabel(book) }}</UBadge>
                    <span class="text-xs text-muted">{{ book.categoryName || "未分类" }}</span>
                  </div>
                </div>
              </div>

              <template #footer>
                <div class="flex items-center justify-between text-xs text-muted">
                  <span>{{ formatDate(book.publishTime) }}</span>
                  <span>ISBN {{ book.isbn }}</span>
                </div>
              </template>
            </UCard>
          </div>
        </section>

        <section v-if="total > queryParams.pageSize" class="flex justify-center">
          <UPagination
              v-model:page="queryParams.pageNum"
              :total="total"
              :items-per-page="queryParams.pageSize"
              @update:page="handlePageChange"
          />
        </section>
      </div>
    </div>

    <UButton
        class="ai-floating absolute bottom-6 right-6 z-10"
        icon="i-lucide-bot"
        label="智慧咨询"
        color="primary"
        variant="soft"
        @click="openAiAssistant"
    />
    <AISidebar v-if="aiSidebarLoaded" v-model:open="openAISidebar"/>
  </div>
</template>

<style scoped>
.hero-panel,
.ai-panel {
  animation: fade-up 420ms ease-out both;
}

.ai-panel {
  box-shadow: 0 14px 28px rgb(34 211 238 / 10%);
}

.book-title {
  display: -webkit-box;
  overflow: hidden;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.book-card {
  opacity: 0;
  animation: fade-up 380ms ease-out forwards;
  animation-delay: var(--book-delay);
  background: rgb(255 255 255 / 0.96);
}

.ai-floating {
  border: 1px solid rgb(103 232 249 / 75%);
  box-shadow: 0 14px 28px rgb(8 145 178 / 18%);
}

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
