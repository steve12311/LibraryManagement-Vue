<script setup lang="ts">
import {computed, defineAsyncComponent, onMounted, reactive, ref, watch} from "vue";
import publicBookApi, {type PublicBookPageVO, type PublicBookQuery} from "@/api/public-book-api";
import LibraryMapApi, {type MapPoint, type PublicBookshelfVO, type PublicLibraryFloorDetailVO, type PublicLibraryFloorVO} from "@/api/library-map-api";
import MapCanvas from "@/components/lib/MapCanvas.vue";
import type { ShelfRenderItem } from "@/components/lib/MapCanvas.vue";
import FileApi from "@/api/file-api.ts";
import ReservationApi from "@/api/library/reservation-api";

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
const publicFloors = ref<PublicLibraryFloorVO[]>([]);
const publicFloorDetail = ref<PublicLibraryFloorDetailVO>();
const selectedPublicFloorId = ref<number>();
const selectedPublicShelfId = ref<number>();
const loadingMap = ref(false);
const fetchSerial = ref(0);
const reservingIsbn = ref<string | null>(null);
const reservedIsbns = ref<Set<string>>(new Set());
const queryParams = reactive<PublicBookQuery>({
  pageNum: 1,
  pageSize: 9,
  field: "name",
  keyword: void 0
});
const imageCache = new Map<string, string>();
const aiHighlights = [
  {icon: "i-lucide-book-open-check", text: "按书名继续追问"},
  {icon: "i-lucide-list-filter", text: "借阅状态与馆藏可用性"},
  {icon: "i-lucide-messages-square", text: "首页直接发起咨询"}
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
const publicOutlinePoints = computed(() => parseOutline(publicFloorDetail.value?.outlineJson));
const selectedPublicShelf = computed(() => {
  return publicFloorDetail.value?.shelves.find((item) => item.shelfId === selectedPublicShelfId.value)
      || publicFloorDetail.value?.shelves[0];
});

const publicShelfItems = computed<ShelfRenderItem[]>(() =>
  (publicFloorDetail.value?.shelves || []).map((s) => ({
    id: s.shelfId,
    shelfNo: s.shelfNo,
    name: s.name,
    x: Number(s.x),
    y: Number(s.y),
    width: Number(s.width),
    height: Number(s.height),
    angle: Number(s.angle || 0),
    capacity: s.capacity,
    usedStock: s.usedStock,
    status: 1,
  })),
);

onMounted(() => {
  void fetchBooks();
  void fetchPublicFloors();
  void fetchReservedIsbns();
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
    toast.add({title: "错误", description: "数据加载失败", color: "error"});
  } finally {
    if (currentFetchSerial === fetchSerial.value) {
      loading.value = false;
    }
  }
}

async function fetchPublicFloors() {
  loadingMap.value = true;
  try {
    publicFloors.value = await LibraryMapApi.getPublicFloors();
    const firstFloor = publicFloors.value[0];
    if (firstFloor) {
      await selectPublicFloor(firstFloor.id);
    }
  } catch (error) {
    console.error(error);
  } finally {
    loadingMap.value = false;
  }
}

async function selectPublicFloor(floorId: number) {
  selectedPublicFloorId.value = floorId;
  loadingMap.value = true;
  try {
    publicFloorDetail.value = await LibraryMapApi.getPublicFloorDetail(floorId);
    selectedPublicShelfId.value = publicFloorDetail.value.shelves[0]?.shelfId;
  } catch (error) {
    console.error(error);
    publicFloorDetail.value = void 0;
    selectedPublicShelfId.value = void 0;
  } finally {
    loadingMap.value = false;
  }
}

function selectPublicShelf(shelf: PublicBookshelfVO) {
  selectedPublicShelfId.value = shelf.shelfId;
}

function selectPublicShelfById(shelfId: number) {
  const shelf = publicFloorDetail.value?.shelves.find((s) => s.shelfId === shelfId);
  if (shelf) selectPublicShelf(shelf);
}

async function fetchReservedIsbns() {
  try {
    const data = await ReservationApi.getPage({ pageNum: 1, pageSize: 100 });
    reservedIsbns.value = new Set(data.list.map((r) => r.isbn));
  } catch {
    // silently ignore — user may not be logged in
  }
}

async function handleReserve(isbn: string) {
  if (reservingIsbn.value) return;
  try {
    reservingIsbn.value = isbn;
    await ReservationApi.create(isbn);
    reservedIsbns.value = new Set([...reservedIsbns.value, isbn]);
    toast.add({title: "预约成功", description: "请在「我的预约」中查看预约状态", color: "success"});
  } catch (error) {
    const message = error instanceof Error ? error.message : "预约失败";
    toast.add({title: "预约失败", description: message, color: "error"});
  } finally {
    reservingIsbn.value = null;
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

function parseOutline(outlineJson?: string): MapPoint[] {
  if (!outlineJson) return [];
  try {
    const parsed = JSON.parse(outlineJson) as MapPoint[];
    if (!Array.isArray(parsed)) return [];
    return parsed
        .filter((item) => Number.isFinite(Number(item.x)) && Number.isFinite(Number(item.y)))
        .map((item) => ({x: Number(item.x), y: Number(item.y)}));
  } catch {
    return [];
  }
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
            <h1 class="hero-title">馆藏检索</h1>
            <p class="hero-description">
              按书名检索公开馆藏，查看可借状态与书目信息
            </p>

            <form class="hero-search" @submit.prevent="handleSearch">
              <UInput
                  v-model="searchKeyword"
                  icon="i-lucide-search"
                  size="xl"
                  class="w-full"
                  placeholder="输入书名搜索"
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

        <section v-if="publicFloors.length > 0" class="section-stack">
          <div class="section-heading">
            <p class="section-kicker">书架地图</p>
            <h2 class="section-title">按楼层查看馆藏位置</h2>
          </div>

          <div class="public-map-grid">
            <div class="public-floor-tabs">
              <UButton
                  v-for="floor in publicFloors"
                  :key="floor.id"
                  :label="floor.name"
                  :variant="floor.id === selectedPublicFloorId ? 'solid' : 'ghost'"
                  icon="i-lucide-layers"
                  @click="selectPublicFloor(floor.id)"
              />
            </div>

            <div class="public-map-frame" :class="{ loading: loadingMap }">
              <MapCanvas
                :outline-points="publicOutlinePoints"
                :shelves="publicShelfItems"
                :selected-shelf-id="selectedPublicShelfId"
                :drawing-outline="false"
                :readonly="true"
                @select-shelf="selectPublicShelfById"
              />
            </div>

            <aside class="public-shelf-books">
              <div class="public-shelf-head">
                <p class="section-kicker">{{ selectedPublicShelf?.shelfNo || "未选择" }}</p>
                <h3>{{ selectedPublicShelf?.name || "书架图书" }}</h3>
                <p>{{ selectedPublicShelf?.usedStock || 0 }}/{{ selectedPublicShelf?.capacity || 0 }} 册</p>
              </div>
              <div class="public-shelf-book-list">
                <div
                    v-for="book in selectedPublicShelf?.books || []"
                    :key="book.isbn"
                    class="public-shelf-book"
                >
                  <div class="public-shelf-book-cover">
                    <img v-if="book.coverUrl" :src="FileApi.resolveUrl(book.coverUrl)" :alt="book.name">
                    <span v-else>暂无封面</span>
                  </div>
                  <div class="min-w-0">
                    <p>{{ book.name }}</p>
                    <span>ISBN {{ book.isbn }}</span>
                  </div>
                </div>
                <p v-if="!selectedPublicShelf?.books?.length" class="public-shelf-empty">暂无绑定图书</p>
              </div>
            </aside>
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
              <h2 class="section-title">当前页重点图书</h2>
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

                    <div class="featured-footnote flex items-center justify-between">
                      <span>仅展示书目信息与可借状态</span>
                      <UBadge v-if="featuredBook && reservedIsbns.has(featuredBook.isbn)" color="success" variant="subtle">
                        已预约
                      </UBadge>
                      <UButton
                          v-else-if="featuredBook"
                          size="sm"
                          icon="i-lucide-calendar-plus"
                          :loading="reservingIsbn === featuredBook.isbn"
                          @click="handleReserve(featuredBook.isbn)"
                      >
                        预约
                      </UButton>
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
                      <UBadge v-if="reservedIsbns.has(book.isbn)" size="xs" color="success" variant="subtle">
                        已预约
                      </UBadge>
                      <UButton
                          v-else
                          size="xs"
                          variant="soft"
                          icon="i-lucide-calendar-plus"
                          :loading="reservingIsbn === book.isbn"
                          @click="handleReserve(book.isbn)"
                      >
                        预约
                      </UButton>
                    </div>
                  </div>
                </UCard>
              </div>
              <UCard v-else class="recommendation-empty">
                <p class="text-base font-semibold text-[var(--library-text)]">当前页仅一本图书</p>
                <p class="mt-2 text-sm text-[var(--library-text-muted)]">翻页或搜索查看其他馆藏</p>
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
                    <UBadge v-if="reservedIsbns.has(book.isbn)" size="xs" color="success" variant="subtle">
                      已预约
                    </UBadge>
                    <UButton
                        v-else
                        size="xs"
                        variant="soft"
                        icon="i-lucide-calendar-plus"
                        :loading="reservingIsbn === book.isbn"
                        @click="handleReserve(book.isbn)"
                    >
                      预约
                    </UButton>
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
              换一个书名再次搜索
            </p>
          </UCard>
        </section>

        <section class="consulting-section">
          <div class="consulting-copy">
            <p class="section-kicker">智慧咨询</p>
            <h2 class="section-title">检索后继续向助手提问</h2>
            <p class="consulting-description">
              选书建议、阅读路线与借阅咨询
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

<style scoped>
.public-map-grid {
  display: grid;
  grid-template-columns: minmax(160px, 200px) minmax(0, 1fr) minmax(260px, 320px);
  gap: 16px;
  align-items: stretch;
}

.public-floor-tabs,
.public-shelf-books {
  border: 1px solid var(--library-border);
  border-radius: 8px;
  background: var(--library-card);
  padding: 12px;
}

.public-floor-tabs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.public-map-frame {
  min-height: 420px;
}

.public-map-frame.loading {
  opacity: 0.72;
}


.public-shelf-books {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 12px;
}

.public-shelf-head h3 {
  margin-top: 4px;
  font-size: 18px;
  font-weight: 700;
  color: var(--library-text);
}

.public-shelf-head p:last-child {
  margin-top: 6px;
  color: var(--library-text-muted);
  font-size: 13px;
}

.public-shelf-book-list {
  display: flex;
  max-height: 340px;
  flex-direction: column;
  gap: 10px;
  overflow: auto;
}

.public-shelf-book {
  display: flex;
  min-width: 0;
  gap: 10px;
  border-top: 1px solid var(--library-border);
  padding-top: 10px;
}

.public-shelf-book-cover {
  display: flex;
  width: 52px;
  height: 68px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 1px solid var(--library-border);
  border-radius: 6px;
  background: var(--library-surface);
  color: var(--library-text-muted);
  font-size: 12px;
}

.public-shelf-book-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.public-shelf-book p {
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  font-size: 14px;
  font-weight: 700;
  color: var(--library-text);
}

.public-shelf-book span,
.public-shelf-empty {
  margin-top: 4px;
  display: block;
  color: var(--library-text-muted);
  font-size: 12px;
}

@media (max-width: 1024px) {
  .public-map-grid {
    grid-template-columns: 1fr;
  }
}
</style>
