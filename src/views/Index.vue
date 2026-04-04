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
  <div class="index-page">
    <div class="page-scroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
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
            <UCard class="h-[360px] animate-pulse border-0 bg-white/75" />
            <div class="space-y-4">
              <UCard
                  v-for="item in 3"
                  :key="item"
                  class="h-[108px] animate-pulse border-0 bg-white/75"
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
                      <p class="line-clamp-2 text-base font-semibold text-[var(--library-text)]">
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
                    <p class="line-clamp-2 text-lg font-semibold text-[var(--library-text)]">
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
            <p class="text-lg font-semibold text-[var(--library-text)]">没有找到相关图书</p>
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
    </div>

    <UButton
        class="ai-floating"
        icon="i-lucide-bot"
        label="智慧咨询"
        color="primary"
        variant="soft"
        @click="openAiAssistant"
    />
    <AISidebar v-if="aiSidebarLoaded" v-model:open="openAISidebar" />
  </div>
</template>

<style scoped>
.index-page {
  position: relative;
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-radius: 28px;
  background:
      linear-gradient(180deg, rgb(255 255 255 / 62%) 0%, rgb(247 249 251 / 96%) 100%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 72%);
}

.index-shell {
  display: flex;
  max-width: 1240px;
  min-height: 100%;
  flex-direction: column;
  gap: 28px;
  margin: 0 auto;
  padding: 28px 20px 34px;
}

.portal-hero,
.consulting-section {
  display: grid;
  grid-template-columns: minmax(0, 1.18fr) minmax(320px, 0.82fr);
  gap: 20px;
  border-radius: 28px;
  padding: 28px;
  background:
      linear-gradient(145deg, rgb(255 255 255 / 96%) 0%, rgb(242 247 251 / 92%) 100%);
  box-shadow: var(--library-shadow-soft);
}

.hero-copy,
.hero-summary,
.consulting-copy,
.consulting-actions {
  min-width: 0;
}

.section-kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: var(--library-accent);
  text-transform: uppercase;
}

.hero-title,
.section-title {
  margin-top: 12px;
  font-size: clamp(28px, 3vw, 40px);
  font-weight: 800;
  line-height: 1.12;
}

.hero-description,
.consulting-description {
  max-width: 42rem;
  margin-top: 14px;
  font-size: 15px;
  line-height: 1.8;
  color: var(--library-text-muted);
}

.hero-search {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 24px;
}

.hero-search-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.hero-result {
  margin-top: 14px;
  font-size: 14px;
  color: var(--library-text-muted);
}

.summary-grid {
  display: grid;
  gap: 12px;
  height: 100%;
}

.summary-item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 22px;
  padding: 18px 20px;
  background: rgb(255 255 255 / 88%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 72%);
}

.summary-label {
  font-size: 12px;
  letter-spacing: 0.12em;
  color: var(--library-text-muted);
  text-transform: uppercase;
}

.summary-value {
  margin-top: 10px;
  font-size: 30px;
  font-weight: 800;
  color: var(--library-text);
}

.summary-description {
  margin-top: 6px;
  font-size: 13px;
  color: var(--library-text-muted);
}

.section-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section-heading {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.featured-grid {
  display: grid;
  gap: 20px;
  grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
}

.featured-grid.single-column {
  grid-template-columns: 1fr;
}

.featured-book-card,
.recommendation-card,
.catalog-card,
.empty-card {
  border: 0;
  border-radius: 26px;
  background: rgb(255 255 255 / 96%);
  box-shadow: var(--library-shadow-soft);
}

.featured-book-body {
  display: grid;
  grid-template-columns: minmax(220px, 0.86fr) minmax(0, 1.14fr);
  gap: 0;
  min-height: 100%;
}

.featured-cover {
  min-height: 340px;
  overflow: hidden;
  border-radius: 26px 0 0 26px;
  background: var(--library-card-muted);
}

.featured-cover-empty,
.recommendation-cover-empty,
.catalog-cover-empty {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-size: 12px;
  color: var(--library-text-muted);
}

.featured-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 28px;
}

.featured-title {
  font-size: clamp(26px, 3vw, 34px);
  font-weight: 800;
  line-height: 1.12;
}

.featured-meta,
.featured-submeta,
.featured-footnote {
  color: var(--library-text-muted);
}

.featured-meta {
  font-size: 15px;
}

.featured-submeta {
  font-size: 14px;
}

.featured-footnote {
  border-top: 1px solid var(--library-border);
  padding-top: 18px;
  font-size: 13px;
  line-height: 1.7;
}

.recommendation-list {
  display: grid;
  gap: 14px;
}

.recommendation-empty {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  justify-content: center;
  padding: 24px;
  border: 0;
  border-radius: 26px;
  background: rgb(255 255 255 / 96%);
  box-shadow: var(--library-shadow-soft);
}

.recommendation-card {
  padding: 18px;
}

.recommendation-cover,
.catalog-cover {
  overflow: hidden;
  background: var(--library-card-muted);
}

.recommendation-cover {
  width: 72px;
  height: 100px;
  flex-shrink: 0;
  border-radius: 18px;
}

.catalog-grid {
  display: grid;
  gap: 18px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.catalog-card {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  transition: transform 200ms ease, box-shadow 200ms ease;
}

.catalog-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--library-shadow);
}

.catalog-card-top {
  display: flex;
  gap: 16px;
}

.catalog-cover {
  width: 96px;
  height: 132px;
  flex-shrink: 0;
  border-radius: 20px;
}

.catalog-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 12px;
  color: var(--library-text-muted);
}

.empty-card {
  padding: 56px 24px;
  text-align: center;
}

.consulting-section {
  align-items: center;
}

.consulting-highlight-list {
  display: grid;
  gap: 12px;
  margin-bottom: 18px;
}

.consulting-highlight {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 18px;
  padding: 14px 16px;
  background: rgb(255 255 255 / 72%);
  color: var(--library-text);
}

.ai-floating {
  position: absolute;
  right: 24px;
  bottom: 24px;
  z-index: 10;
  border: 1px solid rgb(0 99 152 / 18%);
  box-shadow: 0 16px 30px rgb(0 99 152 / 14%);
}

@media (max-width: 1180px) {
  .catalog-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 1024px) {
  .portal-hero,
  .consulting-section,
  .featured-grid,
  .featured-book-body {
    grid-template-columns: 1fr;
  }

  .featured-cover {
    min-height: 280px;
    border-radius: 26px 26px 0 0;
  }
}

@media (max-width: 768px) {
  .index-shell {
    padding-inline: 16px;
  }

  .portal-hero,
  .consulting-section {
    padding: 22px 18px;
  }

  .catalog-grid {
    grid-template-columns: 1fr;
  }

  .ai-floating {
    right: 16px;
    bottom: 16px;
  }
}
</style>
