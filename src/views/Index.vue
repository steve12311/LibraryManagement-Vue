<script setup lang="ts">
import {computed, defineAsyncComponent, onMounted, reactive, ref, watch} from "vue";
import publicBookApi, {type PublicBookPageVO, type PublicBookQuery} from "@/api/public-book-api";
import FileApi from "@/api/file-api.ts";

interface HomeBookCard extends PublicBookPageVO {
  coverPreview?: string;
}

const AISidebar = defineAsyncComponent(() => import("@/components/AISidebar.vue"));

const toast = useToast();
const openAISidebar = ref(false);
const aiSidebarLoaded = ref(false);
const loading = ref(false);
const total = ref(0);
const searchKeyword = ref("");
const activeKeyword = ref("");
const books = ref<HomeBookCard[]>([]);
const fetchSerial = ref(0);
const queryParams = reactive<PublicBookQuery>({
  pageNum: 1,
  pageSize: 9,
  field: "name",
  keyword: void 0
});
const imageCache = new Map<string, string>();
const aiHighlights = [
  {icon: "i-lucide-book-open-check", text: "根据书名与主题继续追问阅读建议"},
  {icon: "i-lucide-list-filter", text: "帮助理解借阅状态与馆藏可用情况"},
  {icon: "i-lucide-messages-square", text: "在首页直接发起咨询，不需要切换页面"}
];

const featuredBook = computed(() => books.value[0]);
const recommendationBooks = computed(() => books.value.slice(1, 4));
const catalogBooks = computed(() => books.value.slice(featuredBook.value ? 1 : 0));
const portalStats = computed(() => [
  {
    label: "公开馆藏",
    value: `${total.value}`,
    description: "当前公开可检索图书"
  },
  {
    label: "当前页码",
    value: `${queryParams.pageNum}`,
    description: "分页浏览实时同步"
  },
  {
    label: "检索状态",
    value: activeKeyword.value ? "已筛选" : "全部馆藏",
    description: activeKeyword.value || "未设置关键词"
  }
]);
const resultText = computed(() => {
  if (!activeKeyword.value) {
    return `当前共收录 ${total.value} 本图书`;
  }
  return `关键词“${activeKeyword.value}”共找到 ${total.value} 本图书`;
});

onMounted(() => {
  void fetchBooks();
});

watch(openAISidebar, (isOpen) => {
  if (isOpen) {
    aiSidebarLoaded.value = true;
  }
});

function normalizeKeyword(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : void 0;
}

function handleSearch() {
  queryParams.pageNum = 1;
  queryParams.keyword = normalizeKeyword(searchKeyword.value);
  activeKeyword.value = queryParams.keyword ?? "";
  void fetchBooks();
}

function clearSearch() {
  if (!searchKeyword.value && !activeKeyword.value) {
    return;
  }
  queryParams.pageNum = 1;
  queryParams.keyword = void 0;
  searchKeyword.value = "";
  activeKeyword.value = "";
  void fetchBooks();
}

function handlePageChange(page: number) {
  queryParams.pageNum = page;
  void fetchBooks();
}

function openAiAssistant() {
  aiSidebarLoaded.value = true;
  openAISidebar.value = true;
}

async function fetchBooks() {
  const currentFetchSerial = ++fetchSerial.value;
  try {
    loading.value = true;
    const data = await publicBookApi.getPage({
      ...queryParams,
      keyword: queryParams.keyword
    });
    if (currentFetchSerial !== fetchSerial.value) return;
    total.value = data.total;
    books.value = data.list.map((book) => ({
      ...book,
      coverPreview: fetchCover(book.coverUrl)
    }));
  } catch (error) {
    if (currentFetchSerial !== fetchSerial.value) return;
    console.error(error);
    books.value = [];
    total.value = 0;
    toast.add({title: "错误", description: "图书数据加载失败", color: "error"});
  } finally {
    if (currentFetchSerial === fetchSerial.value) {
      loading.value = false;
    }
  }
}

function fetchCover(coverUrl?: string) {
  if (!coverUrl) {
    return void 0;
  }
  const cachedUrl = imageCache.get(coverUrl);
  if (cachedUrl) {
    return cachedUrl;
  }
  const resolvedUrl = FileApi.resolveUrl(coverUrl);
  if (!resolvedUrl) {
    return void 0;
  }
  imageCache.set(coverUrl, resolvedUrl);
  return resolvedUrl;
}

function formatDate(date?: Date | string) {
  if (!date) {
    return "未知日期";
  }
  const currentDate = new Date(date);
  if (Number.isNaN(currentDate.getTime())) {
    return "未知日期";
  }
  return currentDate.toLocaleDateString("zh-CN");
}

function getAvailabilityLabel(book: HomeBookCard) {
  return book.available ? "可借" : "无库存";
}

function getAvailabilityColor(book: HomeBookCard) {
  return book.available ? "success" : "error";
}
</script>

<template>
      <div class="index-shell">
        <section class="portal-hero">
          <div class="hero-copy">
            <p class="section-kicker">PUBLIC LIBRARY PORTAL</p>
            <h1 class="hero-title">面向读者的公开馆藏入口</h1>
            <p class="hero-description">
              通过书名快速检索公开馆藏，查看可借状态、基础书目信息，并在需要时调用智慧咨询继续追问。
            </p>

            <form class="hero-search" @submit.prevent="handleSearch">
              <UInput
                  v-model="searchKeyword"
                  icon="i-lucide-search"
                  size="xl"
                  class="w-full"
                  placeholder="输入书名，例如：活着、三体、数据结构"
              />
              <div class="hero-search-actions">
                <UButton type="submit" size="xl" icon="i-lucide-search" :loading="loading">
                  搜索图书
                </UButton>
                <UButton
                    v-if="activeKeyword"
                    size="xl"
                    variant="ghost"
                    color="neutral"
                    icon="i-lucide-rotate-ccw"
                    @click="clearSearch"
                >
                  清空
                </UButton>
              </div>
            </form>

            <p class="hero-result">{{ resultText }}</p>
          </div>

          <div class="hero-summary">
            <div class="summary-grid">
              <div v-for="item in portalStats" :key="item.label" class="summary-item">
                <p class="summary-label">{{ item.label }}</p>
                <p class="summary-value">{{ item.value }}</p>
                <p class="summary-description">{{ item.description }}</p>
              </div>
            </div>
          </div>
        </section>

        <section v-if="loading" class="section-stack">
          <div class="section-heading">
            <p class="section-kicker">馆藏推荐</p>
            <h2 class="section-title">正在加载书目</h2>
          </div>
          <div class="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <UCard class="h-[360px] animate-pulse border border-default bg-elevated" />
            <div class="space-y-4">
              <UCard
                  v-for="item in 3"
                  :key="item"
                  class="h-[108px] animate-pulse border border-default bg-elevated"
              />
            </div>
          </div>
        </section>

        <template v-else-if="books.length > 0">
          <section class="section-stack">
            <div class="section-heading">
              <p class="section-kicker">馆藏推荐</p>
              <h2 class="section-title">优先浏览当前页的重点图书</h2>
            </div>

            <div class="featured-grid" :class="{ 'single-column': recommendationBooks.length === 0 }">
              <UCard class="featured-book-card" :ui="{ body: 'p-0' }">
                <div class="featured-book-body">
                  <div class="featured-cover">
                    <img
                        v-if="featuredBook?.coverPreview"
                        :src="featuredBook.coverPreview"
                        :alt="featuredBook.name"
                        class="h-full w-full object-cover"
                    >
                    <div v-else class="featured-cover-empty">暂无封面</div>
                  </div>

                  <div class="featured-content">
                    <div class="space-y-3">
                      <div class="flex flex-wrap items-center gap-2">
                        <UBadge
                            :color="featuredBook ? getAvailabilityColor(featuredBook) : 'neutral'"
                            variant="subtle"
                        >
                          {{ featuredBook ? getAvailabilityLabel(featuredBook) : "未知" }}
                        </UBadge>
                        <span class="text-sm text-[var(--library-text-muted)]">
                          {{ featuredBook?.categoryName || "未分类" }}
                        </span>
                      </div>

                      <div class="space-y-2">
                        <h3 class="featured-title">{{ featuredBook?.name || "未命名图书" }}</h3>
                        <p class="featured-meta">
                          {{ featuredBook?.author || "未知作者" }} · {{ featuredBook?.publishName || "未知出版社" }}
                        </p>
                        <p class="featured-submeta">
                          出版日期 {{ formatDate(featuredBook?.publishTime) }} · ISBN {{ featuredBook?.isbn || "-" }}
                        </p>
                      </div>
                    </div>

                    <div class="featured-footnote">
                      公开门户仅展示书目信息与当前可借状态，借阅办理请通过馆内业务流程完成。
                    </div>
                  </div>
                </div>
              </UCard>

              <div v-if="recommendationBooks.length > 0" class="recommendation-list">
                <UCard
                    v-for="book in recommendationBooks"
                    :key="book.isbn"
                    class="recommendation-card"
                >
                  <div class="flex gap-3">
                    <div class="recommendation-cover">
                      <img
                          v-if="book.coverPreview"
                          :src="book.coverPreview"
                          :alt="book.name"
                          class="h-full w-full object-cover"
                      >
                      <div v-else class="recommendation-cover-empty">暂无封面</div>
                    </div>
                    <div class="min-w-0 flex-1 space-y-2">
                      <div class="flex items-center gap-2">
                        <UBadge :color="getAvailabilityColor(book)" variant="subtle">
                          {{ getAvailabilityLabel(book) }}
                        </UBadge>
                        <span class="truncate text-xs text-[var(--library-text-muted)]">
                          {{ book.categoryName || "未分类" }}
                        </span>
                      </div>
                      <p class="line-clamp-2 text-[15px] font-semibold text-[var(--library-text)]">
                        {{ book.name }}
                      </p>
                      <p class="truncate text-sm text-[var(--library-text-muted)]">
                        {{ book.author || "未知作者" }} · {{ book.publishName || "未知出版社" }}
                      </p>
                    </div>
                  </div>
                </UCard>
              </div>
              <UCard v-else class="recommendation-empty">
                <p class="text-base font-semibold text-[var(--library-text)]">当前页仅展示一本重点图书</p>
                <p class="mt-2 text-sm text-[var(--library-text-muted)]">继续翻页或重新搜索，可查看更多公开馆藏。</p>
              </UCard>
            </div>
          </section>

          <section v-if="catalogBooks.length > 0" class="section-stack">
            <div class="section-heading">
              <p class="section-kicker">馆藏目录</p>
              <h2 class="section-title">当前页书目列表</h2>
            </div>

            <div class="catalog-grid">
              <UCard
                  v-for="(book, index) in catalogBooks"
                  :key="`${book.isbn}-${index}`"
                  class="catalog-card"
              >
                <div class="catalog-card-top">
                  <div class="catalog-cover">
                    <img
                        v-if="book.coverPreview"
                        :src="book.coverPreview"
                        :alt="book.name"
                        class="h-full w-full object-cover"
                    >
                    <div v-else class="catalog-cover-empty">暂无封面</div>
                  </div>
                  <div class="min-w-0 flex-1 space-y-2">
                    <div class="flex flex-wrap items-center gap-2">
                      <UBadge :color="getAvailabilityColor(book)" variant="subtle">
                        {{ getAvailabilityLabel(book) }}
                      </UBadge>
                      <span class="truncate text-xs text-[var(--library-text-muted)]">
                        {{ book.categoryName || "未分类" }}
                      </span>
                    </div>
                    <p class="line-clamp-2 text-base font-semibold text-[var(--library-text)]">
                      {{ book.name }}
                    </p>
                    <div class="space-y-1 text-sm text-[var(--library-text-muted)]">
                      <p class="truncate">作者：{{ book.author || "未知" }}</p>
                      <p class="truncate">出版社：{{ book.publishName || "未知" }}</p>
                    </div>
                  </div>
                </div>

                <template #footer>
                  <div class="catalog-footer">
                    <span>{{ formatDate(book.publishTime) }}</span>
                    <span>ISBN {{ book.isbn }}</span>
                  </div>
                </template>
              </UCard>
            </div>
          </section>
        </template>

        <section v-else class="section-stack">
          <UCard class="empty-card">
            <p class="text-base font-semibold text-[var(--library-text)]">没有找到相关图书</p>
            <p class="mt-2 text-sm text-[var(--library-text-muted)]">
              可以换一个更短或更准确的书名再次搜索。
            </p>
          </UCard>
        </section>

        <section class="consulting-section">
          <div class="consulting-copy">
            <p class="section-kicker">智慧咨询</p>
            <h2 class="section-title">检索到图书之后，继续向助手提问</h2>
            <p class="consulting-description">
              可继续追问选书建议、阅读路线、主题延展和借阅说明，帮助读者从检索进入理解与决策。
            </p>
          </div>

          <div class="consulting-actions">
            <div class="consulting-highlight-list">
              <div
                  v-for="item in aiHighlights"
                  :key="item.text"
                  class="consulting-highlight"
              >
                <UIcon :name="item.icon" class="h-4 w-4 text-[var(--library-accent)]" />
                <span>{{ item.text }}</span>
              </div>
            </div>
            <UButton icon="i-lucide-sparkles" size="xl" @click="openAiAssistant">
              打开智慧咨询
            </UButton>
          </div>
        </section>

        <section v-if="total > queryParams.pageSize" class="flex justify-center pb-1">
          <UPagination
              v-model:page="queryParams.pageNum"
              :total="total"
              :items-per-page="queryParams.pageSize"
              @update:page="handlePageChange"
          />
        </section>
      </div>

    <UButton
        class="ai-floating"
        icon="i-lucide-bot"
        label="智慧咨询"
        color="primary"
        variant="ghost"
        @click="openAiAssistant"
    />
    <AISidebar v-if="aiSidebarLoaded" v-model:open="openAISidebar" />
</template>
