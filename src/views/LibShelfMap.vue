<script setup lang="ts">
import {computed, onMounted, reactive, ref, watch} from "vue";
import {ElMessageBox} from "element-plus";
import LibraryMapApi, {
  type BookshelfForm,
  type BookshelfVO,
  type LibraryFloorForm,
  type LibraryFloorVO,
} from "@/api/library-map-api";
import type { MapPoint } from "@/utils/svg-coords";
import { parseOutline } from "@/utils/svg-coords";
import SystemPageHeader from "@/components/system/SystemPageHeader.vue";
import SystemQueryCard from "@/components/system/SystemQueryCard.vue";
import MapCanvas from "@/components/lib/MapCanvas.vue";

const toast = useToast();
const floors = ref<LibraryFloorVO[]>([]);
const shelves = ref<BookshelfVO[]>([]);
const selectedFloorId = ref<number>();
const selectedShelfId = ref<number>();
const loadingFloors = ref(false);
const loadingShelves = ref(false);
const savingFloor = ref(false);
const savingShelf = ref(false);
const savingAllShelves = ref(false);
const drawingOutline = ref(false);
const outlinePoints = ref<MapPoint[]>([]);

const statusItems = [
  {label: "启用", value: 1},
  {label: "停用", value: 0},
];

const floorForm = reactive<LibraryFloorForm>(createFloorForm());
const shelfForm = reactive<BookshelfForm>(createShelfForm());

const selectedShelf = computed(() => shelves.value.find((item) => item.id === selectedShelfId.value));
const totalCapacity = computed(() => shelves.value.reduce((sum, item) => sum + (item.capacity || 0), 0));
const usedCapacity = computed(() => shelves.value.reduce((sum, item) => sum + (item.usedStock || 0), 0));

onMounted(() => {
  void fetchFloors();
});

function createFloorForm(): LibraryFloorForm {
  return {
    id: undefined,
    floorNo: 1,
    name: "",
    outlineJson: "[]",
    sort: 1,
    status: 1,
  };
}

function createShelfForm(floorId = selectedFloorId.value || 0): BookshelfForm {
  return {
    id: undefined,
    floorId,
    shelfNo: "",
    name: "",
    x: 80,
    y: 80,
    width: 120,
    height: 44,
    angle: 0,
    capacity: 30,
    status: 1,
    remark: "",
  };
}

function fillFloorForm(floor?: LibraryFloorVO) {
  Object.assign(floorForm, floor ? {
    id: floor.id,
    floorNo: floor.floorNo,
    name: floor.name,
    outlineJson: floor.outlineJson || "[]",
    sort: floor.sort ?? floor.floorNo,
    status: floor.status,
  } : createFloorForm());
}

function fillShelfForm(shelf?: BookshelfVO) {
  Object.assign(shelfForm, shelf ? {
    id: shelf.id,
    floorId: shelf.floorId,
    shelfNo: shelf.shelfNo,
    name: shelf.name || "",
    x: Number(shelf.x ?? 0),
    y: Number(shelf.y ?? 0),
    width: Number(shelf.width ?? 120),
    height: Number(shelf.height ?? 44),
    angle: Number(shelf.angle ?? 0),
    capacity: shelf.capacity,
    status: shelf.status,
    remark: shelf.remark || "",
  } : createShelfForm());
}

async function fetchFloors() {
  loadingFloors.value = true;
  try {
    floors.value = await LibraryMapApi.getFloors();
    const nextFloorId = selectedFloorId.value && floors.value.some((item) => item.id === selectedFloorId.value)
        ? selectedFloorId.value
        : floors.value[0]?.id;
    if (nextFloorId) {
      await selectFloor(nextFloorId);
    } else {
      shelves.value = [];
      selectedFloorId.value = void 0;
      fillFloorForm();
      fillShelfForm();
      outlinePoints.value = [];
    }
  } catch (error) {
    console.error(error);
    toast.add({title: "错误", description: "加载楼层失败", color: "error"});
  } finally {
    loadingFloors.value = false;
  }
}

async function selectFloor(floorId: number) {
  selectedFloorId.value = floorId;
  const floor = floors.value.find((item) => item.id === floorId);
  fillFloorForm(floor);
  outlinePoints.value = parseOutline(floor?.outlineJson);
  selectedShelfId.value = void 0;
  fillShelfForm();
  await fetchShelves();
}

async function fetchShelves() {
  if (!selectedFloorId.value) return;
  loadingShelves.value = true;
  try {
    shelves.value = await LibraryMapApi.getShelves(selectedFloorId.value);
    if (selectedShelfId.value) {
      fillShelfForm(selectedShelf.value);
    }
  } catch (error) {
    console.error(error);
    shelves.value = [];
    toast.add({title: "错误", description: "加载书架失败", color: "error"});
  } finally {
    loadingShelves.value = false;
  }
}

async function saveFloor() {
  savingFloor.value = true;
  try {
    const payload = {...floorForm, outlineJson: JSON.stringify(outlinePoints.value)};
    const result = floorForm.id
        ? await LibraryMapApi.updateFloor(floorForm.id, payload)
        : await LibraryMapApi.createFloor(payload);
    selectedFloorId.value = result.id;
    toast.add({title: "成功", description: "楼层已保存", color: "success"});
    await fetchFloors();
  } catch (error) {
    toast.add({title: "错误", description: error instanceof Error ? error.message : "保存楼层失败", color: "error"});
  } finally {
    savingFloor.value = false;
  }
}

async function deleteFloor() {
  if (!floorForm.id) return;
  await ElMessageBox.confirm("确认删除当前楼层吗？", "警告");
  try {
    await LibraryMapApi.deleteFloor(floorForm.id);
    selectedFloorId.value = void 0;
    toast.add({title: "成功", description: "楼层已删除", color: "success"});
    await fetchFloors();
  } catch (error) {
    toast.add({title: "错误", description: error instanceof Error ? error.message : "删除楼层失败", color: "error"});
  }
}

function startNewFloor() {
  selectedFloorId.value = void 0;
  selectedShelfId.value = void 0;
  shelves.value = [];
  outlinePoints.value = [];
  fillFloorForm();
  fillShelfForm();
}

function startNewShelf() {
  if (!selectedFloorId.value) {
    toast.add({title: "错误", description: "请先选择楼层", color: "error"});
    return;
  }
  selectedShelfId.value = void 0;
  fillShelfForm();
}

async function saveShelf() {
  if (!selectedFloorId.value) return;
  savingShelf.value = true;
  try {
    const payload = {...shelfForm, floorId: selectedFloorId.value};
    const result = shelfForm.id
        ? await LibraryMapApi.updateShelf(shelfForm.id, payload)
        : await LibraryMapApi.createShelf(payload);
    selectedShelfId.value = result.id;
    toast.add({title: "成功", description: "书架已保存", color: "success"});
    await fetchShelves();
  } catch (error) {
    toast.add({title: "错误", description: error instanceof Error ? error.message : "保存书架失败", color: "error"});
  } finally {
    savingShelf.value = false;
  }
}

async function saveAllShelves() {
  if (!selectedFloorId.value) return;
  savingAllShelves.value = true;
  try {
    if (!shelfForm.id) {
      const payload = {...shelfForm, floorId: selectedFloorId.value};
      const result = await LibraryMapApi.createShelf(payload);
      selectedShelfId.value = result.id;
    }
    if (shelves.value.length > 0) {
      const updates = shelves.value.map(shelf => ({
        id: shelf.id,
        floorId: shelf.floorId,
        shelfNo: shelf.shelfNo,
        name: shelf.name || "",
        x: Number(shelf.x),
        y: Number(shelf.y),
        width: Number(shelf.width),
        height: Number(shelf.height),
        angle: Number(shelf.angle || 0),
        capacity: shelf.capacity,
        status: shelf.status,
        remark: shelf.remark || "",
      }));
      await Promise.all(updates.map(form => LibraryMapApi.updateShelf(form.id, form)));
    }
    toast.add({title: "成功", description: "全部书架已保存", color: "success"});
    await fetchShelves();
  } catch (error) {
    toast.add({title: "错误", description: error instanceof Error ? error.message : "保存全部书架失败", color: "error"});
  } finally {
    savingAllShelves.value = false;
  }
}

async function deleteShelf() {
  if (!shelfForm.id) return;
  await ElMessageBox.confirm("确认删除当前书架吗？", "警告");
  try {
    await LibraryMapApi.deleteShelf(shelfForm.id);
    selectedShelfId.value = void 0;
    fillShelfForm();
    toast.add({title: "成功", description: "书架已删除", color: "success"});
    await fetchShelves();
  } catch (error) {
    toast.add({title: "错误", description: error instanceof Error ? error.message : "删除书架失败", color: "error"});
  }
}

async function saveOutline() {
  if (!selectedFloorId.value) return;
  try {
    const result = await LibraryMapApi.updateFloorOutline(selectedFloorId.value, JSON.stringify(outlinePoints.value));
    fillFloorForm(result);
    const current = floors.value.find((item) => item.id === result.id);
    if (current) {
      Object.assign(current, result);
    }
    toast.add({title: "成功", description: "轮廓已保存", color: "success"});
  } catch (error) {
    toast.add({title: "错误", description: error instanceof Error ? error.message : "保存轮廓失败", color: "error"});
  }
}

function clearOutline() {
  outlinePoints.value = [];
}

function removeLastPoint() {
  outlinePoints.value = outlinePoints.value.slice(0, -1);
}

function handleSelectShelf(shelfId: number) {
  selectedShelfId.value = shelfId;
  fillShelfForm(shelves.value.find(s => s.id === shelfId));
}

function handleShelfMove(shelfId: number, x: number, y: number) {
  const shelf = shelves.value.find(s => s.id === shelfId);
  if (shelf) {
    shelf.x = x;
    shelf.y = y;
  }
  shelfForm.x = x;
  shelfForm.y = y;
}

function handleShelfRotate(shelfId: number, angle: number) {
  const shelf = shelves.value.find(s => s.id === shelfId);
  if (shelf) {
    shelf.angle = angle;
  }
  shelfForm.angle = angle;
}

function handlePointMove(index: number, point: MapPoint) {
  const updated = [...outlinePoints.value];
  updated[index] = point;
  outlinePoints.value = updated;
}

function handleCanvasClick(x: number, y: number) {
  if (drawingOutline.value) {
    outlinePoints.value = [...outlinePoints.value, { x, y }];
    return;
  }
  if (selectedFloorId.value) {
    shelfForm.x = x;
    shelfForm.y = y;
  }
}

watch(
  () => ({
    x: shelfForm.x,
    y: shelfForm.y,
    width: shelfForm.width,
    height: shelfForm.height,
    angle: shelfForm.angle,
  }),
  (form) => {
    const shelf = shelves.value.find(s => s.id === selectedShelfId.value);
    if (shelf) {
      shelf.x = form.x;
      shelf.y = form.y;
      shelf.width = form.width;
      shelf.height = form.height;
      shelf.angle = form.angle;
    }
  },
);
</script>

<template>
  <div class="system-page-shell">
    <div class="system-page-shell__header">
      <SystemPageHeader
          kicker="SHELF MAP"
          title="书架地图"
          description="楼层轮廓、书架位置与容量管理"
          :stats="[
            { label: '楼层数', value: floors.length },
            { label: '当前层书架', value: shelves.length },
            { label: '容量占用', value: `${usedCapacity}/${totalCapacity}` }
          ]"
      />
      <SystemQueryCard>
        <template #actions>
          <div class="system-query-row">
            <UButton icon="i-lucide-plus" variant="subtle" label="新增楼层" @click="startNewFloor"/>
            <UButton icon="i-lucide-save" :loading="savingFloor" label="保存楼层" @click="saveFloor"/>
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" :disabled="!floorForm.id" label="删除楼层" @click="deleteFloor"/>
            <UButton icon="i-lucide-book-marked" variant="subtle" :disabled="!selectedFloorId" label="新增书架" @click="startNewShelf"/>
            <UButton icon="i-lucide-save" :loading="savingAllShelves" :disabled="!selectedFloorId" label="保存书架" @click="saveAllShelves"/>
            <UButton icon="i-lucide-trash-2" color="error" variant="ghost" :disabled="!shelfForm.id" label="删除书架" @click="deleteShelf"/>
          </div>
        </template>
      </SystemQueryCard>
    </div>

    <div class="shelf-map-layout">
      <aside class="shelf-map-panel floor-panel">
        <div class="panel-title-row">
          <h2>楼层</h2>
          <UButton icon="i-lucide-refresh-cw" variant="ghost" :loading="loadingFloors" @click="fetchFloors"/>
        </div>
        <div class="floor-list">
          <UButton
              v-for="floor in floors"
              :key="floor.id"
              :label="`${floor.name} / ${floor.floorNo}层`"
              :variant="floor.id === selectedFloorId ? 'solid' : 'ghost'"
              :color="floor.status === 1 ? 'primary' : 'neutral'"
              class="justify-start"
              @click="selectFloor(floor.id)"
          />
        </div>
      </aside>

      <MapCanvas
        :outline-points="outlinePoints"
        :shelves="shelves"
        :selected-shelf-id="selectedShelfId"
        :selected-floor-id="selectedFloorId"
        :drawing-outline="drawingOutline"
        @select-shelf="handleSelectShelf"
        @update:shelf-position="handleShelfMove"
        @update:shelf-angle="handleShelfRotate"
        @update:outline-point="handlePointMove"
        @click-canvas="handleCanvasClick"
        @update:drawing-outline="drawingOutline = $event"
        @remove-last-point="removeLastPoint"
        @clear-outline="clearOutline"
        @save-outline="saveOutline"
      />

      <aside class="shelf-map-panel editor-panel">
        <div class="editor-section">
          <h2>楼层信息</h2>
          <UForm :state="floorForm" class="editor-form">
            <UFieldGroup class="w-full gap-2">
              <UFormField label="楼层" class="w-full">
                <UInputNumber v-model="floorForm.floorNo" :min="1" class="w-full"/>
              </UFormField>
              <UFormField label="排序" class="w-full">
                <UInputNumber v-model="floorForm.sort" :min="0" class="w-full"/>
              </UFormField>
            </UFieldGroup>
            <UFormField label="名称">
              <UInput v-model="floorForm.name"/>
            </UFormField>
            <UFormField label="状态">
              <USelect value-key="value" v-model="floorForm.status" :items="statusItems" class="w-full"/>
            </UFormField>
          </UForm>
        </div>

        <div class="editor-section">
          <h2>书架信息</h2>
          <UForm :state="shelfForm" class="editor-form">
            <UFieldGroup class="w-full gap-2">
              <UFormField label="书架号" class="w-full">
                <UInput v-model="shelfForm.shelfNo"/>
              </UFormField>
              <UFormField label="容量" class="w-full">
                <UInputNumber v-model="shelfForm.capacity" :min="1" class="w-full"/>
              </UFormField>
            </UFieldGroup>
            <UFormField label="名称">
              <UInput v-model="shelfForm.name"/>
            </UFormField>
            <UFieldGroup class="w-full gap-2">
              <UFormField label="X" class="w-full">
                <UInputNumber v-model="shelfForm.x" :min="0" class="w-full"/>
              </UFormField>
              <UFormField label="Y" class="w-full">
                <UInputNumber v-model="shelfForm.y" :min="0" class="w-full"/>
              </UFormField>
            </UFieldGroup>
            <UFieldGroup class="w-full gap-2">
              <UFormField label="宽" class="w-full">
                <UInputNumber v-model="shelfForm.width" :min="1" class="w-full"/>
              </UFormField>
              <UFormField label="高" class="w-full">
                <UInputNumber v-model="shelfForm.height" :min="1" class="w-full"/>
              </UFormField>
            </UFieldGroup>
            <UFieldGroup class="w-full gap-2">
              <UFormField label="角度" class="w-full">
                <UInputNumber v-model="shelfForm.angle" :min="-360" :max="360" class="w-full"/>
              </UFormField>
              <UFormField label="状态" class="w-full">
                <USelect value-key="value" v-model="shelfForm.status" :items="statusItems" class="w-full"/>
              </UFormField>
            </UFieldGroup>
            <UFormField label="备注">
              <UTextarea v-model="shelfForm.remark" :rows="3"/>
            </UFormField>
          </UForm>
          <div v-if="selectedShelf" class="usage-line">
            <span>已占用 {{ selectedShelf.usedStock }} 册</span>
            <span>剩余 {{ selectedShelf.remainingCapacity }} 册</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.shelf-map-layout {
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(0, 1fr) minmax(280px, 340px);
  gap: 14px;
  min-height: 0;
  flex: 1;
}

.shelf-map-panel {
  min-width: 0;
  border: 1px solid var(--library-border);
  border-radius: 8px;
  background: var(--library-card);
}

.shelf-map-panel {
  padding: 14px;
  overflow: auto;
}

.panel-title-row,
.map-toolbar,
.usage-line {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.panel-title-row h2,
.editor-section h2 {
  font-size: 15px;
  font-weight: 700;
  color: var(--library-text);
}

.floor-list,
.editor-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.floor-list {
  margin-top: 12px;
}

.editor-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.editor-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.usage-line {
  border-top: 1px solid var(--library-border);
  padding-top: 10px;
  color: var(--library-text-muted);
  font-size: 13px;
}

@media (max-width: 1180px) {
  .shelf-map-layout {
    grid-template-columns: 1fr;
  }

  .map-workspace {
    min-height: 480px;
  }
}
</style>
