<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, shallowRef, useTemplateRef, watch} from "vue";
import MenuAPI, {type MenuForm, type MenuId, type MenuQuery, type MenuVO} from "@/api/system/menu-api.ts";
import type {TableColumn, TableRow} from "@nuxt/ui";
import {MenuTypeEnum} from "@/enums/system/menu-enum.ts";
import {ElTreeSelect, ElDrawer, ElDialog} from "element-plus";
import WarningModal from "@/components/WarningModal.vue";

onMounted(() => {
  handleQuery()
})

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UFieldGroup = resolveComponent('UFieldGroup')
const UTooltip = resolveComponent('UTooltip')
const UCheckbox = resolveComponent('UCheckbox')

const overlay = useOverlay()
const modal = overlay.create(WarningModal)
const toast = useToast()

type Status = {
  visible: boolean;
  title: string;
}
const mode = ref<'add' | 'edit' | 'show'>('show');
const slider = ref<Status>({
  visible: false,
  title: "菜单详情",
})
const dialog = ref<Status>({
  visible: false,
  title: "新增菜单",
})
const table = useTemplateRef("table");
const queryParams = reactive<MenuQuery>({});
const searchForm = reactive<MenuQuery>({
  keywords: "",
})
const menuTableData = shallowRef<MenuVO[]>([]);
const loadingMenuList = ref(false)
const loadingMenuOptions = ref(false)
const submittingMenu = ref(false)
const columnVisibility = ref({
  id: false,
})
const columns = ref<TableColumn<MenuVO>[]>([
  {
    id: 'select',
    header: ({table}) =>
        h(UCheckbox, {
          modelValue: table.getIsSomePageRowsSelected()
              ? 'indeterminate'
              : table.getIsAllPageRowsSelected(),
          'onUpdate:modelValue': (value: boolean | 'indeterminate') =>
              table.toggleAllPageRowsSelected(!!value),
          'aria-label': 'Select all'
        }),
    cell: ({row}) =>
        h(UCheckbox, {
          modelValue: row.getIsSelected() ? true : row.getIsSomeSelected() ? 'indeterminate' : false,
          'onUpdate:modelValue': (value: boolean | 'indeterminate') => row.toggleSelected(!!value),
          'aria-label': 'Select row'
        })
  },
  {
    accessorKey: "id",
    header: "菜单编号"
  },
  {
    accessorKey: "name",
    header: "菜单名称",
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
          onClick: (ev: Event) => {
            ev.stopPropagation()
            if (!row.getCanExpand()) return;
            row.toggleExpanded();
          }
        }),
        row.getValue('name') as string
      ])
    }
  },
  {
    accessorKey: "icon",
    header: "图标",
    cell: ({row}) => {
      return h(UButton, {
        icon: row.getValue('icon'),
        color: "neutral",
        variant: "outline"
      })
    }
  },
  {
    accessorKey: "type",
    header: "类型",
    cell: ({row}) => {
      return h(UBadge, {
            class: 'capitalize',
            variant: 'subtle',
            color: (() => {
              switch (row.getValue('type')) {
                case MenuTypeEnum.MENU:
                  return "success"
                case MenuTypeEnum.CATALOG:
                  return "info"
                case MenuTypeEnum.BUTTON:
                  return "warning"
                case MenuTypeEnum.EXTLINK:
                  return "neutral"
                default:
                  return "error"
              }
            })()
          }, () => {
            switch (row.getValue('type')) {
              case MenuTypeEnum.MENU:
                return "菜单"
              case MenuTypeEnum.CATALOG:
                return "目录"
              case MenuTypeEnum.BUTTON:
                return "按钮"
              case MenuTypeEnum.EXTLINK:
                return "外链"
              default:
                return "未知"
            }
          }
      )
    }
  },
  {
    accessorKey: "routeName",
    header: "路由名称"
  },
  {
    accessorKey: "routePath",
    header: "路由路径"
  },
  {
    accessorKey: "component",
    header: "组件路径"
  },
  {
    id: "action",
    accessorKey: "userId",
    header: "操作",
    cell: ({row}) => {
      return h(UFieldGroup, undefined, () => [
        (() => {
          if (row.original.type === MenuTypeEnum.CATALOG) {
            return h(UTooltip, {text: "新增", delayDuration: 0}, () => [
              h(UButton, {
                icon: "i-lucide-plus", variant: "ghost", onClick: () => {
                  openAddMenu(row.original.id ?? 0)
                }
              }),
            ])
          }
        })(),
        h(UTooltip, {text: "修改", delayDuration: 0}, () => [
          h(UButton, {
            icon: "i-lucide-clipboard-pen-line", variant: "ghost", onClick: () => {
              openEditByRow(row.original)
            }
          }),
        ]),
        h(UTooltip, {text: "删除", delayDuration: 0}, () => [
          h(UButton, {
            icon: "i-lucide-trash-2", variant: "ghost", onClick: () => {
              table.value?.tableApi?.toggleAllPageRowsSelected(false)
              row.toggleSelected(true)
              deleteMenu()
            }
          }),
        ])
      ])
    }
  }
])
const menuOptions = ref<OptionType[]>([])
const defaultMenuFormData: MenuForm = {
  id: undefined,
  parentId: 0,
  visible: 1,
  sort: 1,
  type: MenuTypeEnum.MENU, // 默认菜单
  alwaysShow: 0,
  keepAlive: 1,
  perms: [],
  params: [],
}

function createMenuForm(overrides: Partial<MenuForm> = {}): MenuForm {
  return {
    ...defaultMenuFormData,
    ...overrides,
    perms: [...(overrides.perms ?? defaultMenuFormData.perms ?? [])],
    params: [...(overrides.params ?? defaultMenuFormData.params ?? [])],
  }
}

// 菜单表单数据
const formData = ref<MenuForm>(createMenuForm());
const tabs = [
  {
    label: '菜单',
    slot: 'menu'
  },
  {
    label: '目录',
    slot: 'catalog'
  }
]
const tabActiveIndex = ref("0")

watch(tabActiveIndex, (value) => {
  if (value === "0") {
    formData.value.type = MenuTypeEnum.MENU;
  } else if (value === "1") {
    formData.value.type = MenuTypeEnum.CATALOG;
  }
}, {immediate: true})

// 查询菜单
function applySearchParams() {
  const keywords = searchForm.keywords?.trim()
  queryParams.keywords = keywords || undefined
}

async function handleQuery() {
  try {
    loadingMenuList.value = true
    applySearchParams()
    menuTableData.value = await MenuAPI.getList(queryParams)
  } catch (error) {
    console.error(error);
  } finally {
    loadingMenuList.value = false
  }
}

function resetQuery() {
  searchForm.keywords = ""
  handleQuery()
}

function getIconInputValue(icon?: string) {
  return (icon || "").replace("i-lucide-", "")
}

function setIconInputValue(value: string | number) {
  const icon = String(value ?? "").trim()
  formData.value.icon = icon ? `i-lucide-${icon}` : ""
}

function getCatalogRoutePathValue(routePath?: string) {
  return (routePath || "").replace(/^\//, "")
}

function setCatalogRoutePathValue(value: string | number) {
  formData.value.routePath = String(value ?? "").trim().replace(/^\/+/, "")
}

function normalizeMenuFormFromApi(data: MenuForm, parentId?: MenuId) {
  const normalized = createMenuForm({
    ...data,
    parentId: data.parentId ?? parentId ?? 0,
    perms: (data.perms ?? []).map((item) => ({...item})),
    params: (data.params ?? []).map((item) => ({...item})),
  })
  if (normalized.id !== undefined && normalized.perms?.length) {
    normalized.perms = normalized.perms.map((item) => ({
      ...item,
      parentId: item.parentId ?? normalized.id,
    }))
  }
  return normalized
}

function normalizeMenuPayload() {
  const payload = createMenuForm({
    ...formData.value,
    name: formData.value.name?.trim(),
    routeName: formData.value.routeName?.trim(),
    routePath: formData.value.routePath?.trim().replace(/^\/+/, ""),
    component: formData.value.component?.trim(),
    redirect: formData.value.redirect?.trim(),
    perm: formData.value.perm?.trim(),
    parentId: Number(formData.value.parentId ?? 0),
    sort: Number(formData.value.sort ?? 1),
  })

  payload.visible = Number(payload.visible ?? 1) as MenuForm["visible"]
  payload.alwaysShow = Number(payload.alwaysShow ?? 0) as MenuForm["alwaysShow"]
  payload.keepAlive = Number(payload.keepAlive ?? 1) as MenuForm["keepAlive"]
  payload.perms = (payload.perms ?? []).map((item) => ({
    ...item,
    parentId: payload.id ?? payload.parentId ?? 0,
    label: item.label?.trim(),
    value: item.value?.trim(),
  }))

  return payload
}

function showMenuInfo(_: unknown, row: TableRow<MenuVO>) {
  const menuId = row.original.id
  if (row.original.type !== MenuTypeEnum.MENU || menuId === undefined || menuId === null) {
    return
  }
  mode.value = "show";
  openMenuDialog(void 0, menuId)
}

function openAddMenu(parentId: MenuId = 0) {
  mode.value = "add";
  tabActiveIndex.value = "0"
  openMenuDialog(parentId)
}

function openEditByRow(row: MenuVO) {
  if (row.id === undefined || row.id === null) {
    toast.add({title: "错误", description: "菜单ID不存在，无法编辑", color: "error"})
    return
  }
  tabActiveIndex.value = row.type === MenuTypeEnum.CATALOG ? "1" : "0"
  editMenu(row.parentId, row.id)
}

function editMenu(parentId?: MenuId, menuId?: MenuId) {
  mode.value = "edit";
  openMenuDialog(parentId, menuId)
}

function editSelectedMenu() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().flatRows ?? []
  if (selectedRows.length !== 1) {
    toast.add({title: "错误", description: "请选择一条菜单进行修改", color: "error"})
    return
  }
  const selectedRow = selectedRows[0]
  if (!selectedRow) {
    return
  }
  openEditByRow(selectedRow.original)
}

async function deleteMenu() {
  const selectedRows = table.value?.tableApi?.getFilteredSelectedRowModel().flatRows ?? []
  const deleteIds = selectedRows
      .map((row) => row.original.id)
      .filter((id): id is MenuId => id !== undefined && id !== null)

  if (!deleteIds.length) {
    toast.add({title: "错误", description: "请选择需要删除的菜单", color: "error"})
    return
  }

  const instance = await modal.open({
    content: "确定要删除吗？",
  })
  if (!instance) {
    table.value?.tableApi?.toggleAllPageRowsSelected(false)
    return
  }

  try {
    await MenuAPI.delete(deleteIds)
    await handleQuery()
    toast.add({title: "成功", description: "删除成功", color: "success"})
  } catch (error) {
    console.error(error)
  } finally {
    table.value?.tableApi?.toggleAllPageRowsSelected(false)
  }
}

async function openMenuDialog(parentId?: MenuId, menuId?: MenuId) {
  loadingMenuOptions.value = true
  try {
    const options = await MenuAPI.getOptions(true)
    menuOptions.value = [{value: 0, label: "顶级菜单", children: options}]

    if (menuId === undefined || menuId === null) {
      formData.value = createMenuForm({
        parentId: Number(parentId ?? 0),
        type: tabActiveIndex.value === "1" ? MenuTypeEnum.CATALOG : MenuTypeEnum.MENU,
      })
      dialog.value.title = "新增菜单";
      dialog.value.visible = true;
      return
    }

    const data = await MenuAPI.getFormData(menuId)
    formData.value = normalizeMenuFormFromApi(data, parentId)
    tabActiveIndex.value = formData.value.type === MenuTypeEnum.CATALOG ? "1" : "0"
    if (mode.value === 'show') {
      slider.value.visible = true;
    } else {
      dialog.value.title = "编辑菜单"
      dialog.value.visible = true;
    }
  } catch (error) {
    console.error(error)
  } finally {
    loadingMenuOptions.value = false
  }
}

async function handleSubmit() {
  if (submittingMenu.value) {
    return
  }
  const payload = normalizeMenuPayload()
  const menuId = payload.id
  if (payload.type == MenuTypeEnum.MENU && Number(payload.parentId) === 0) {
    toast.add({title: "错误", description: "顶级菜单不能为菜单", color: "error"})
    return;
  }
  if (!payload.name?.trim()) {
    toast.add({title: "错误", description: "菜单名称不能为空", color: "error"})
    return
  }
  if (payload.type === MenuTypeEnum.MENU && (!payload.routeName || !payload.routePath || !payload.component)) {
    toast.add({title: "错误", description: "菜单的路由名称、路径、组件不能为空", color: "error"})
    return
  }
  if (payload.type === MenuTypeEnum.CATALOG && !payload.routePath) {
    toast.add({title: "错误", description: "目录的路由路径不能为空", color: "error"})
    return
  }
  if (menuId !== undefined && menuId !== null && Number(payload.parentId) === menuId) {
    toast.add({title: "错误", description: "父级菜单不能为当前菜单", color: "error"})
    return
  }

  try {
    submittingMenu.value = true
    if (menuId !== undefined && menuId !== null) {
      await MenuAPI.update(menuId, payload)
      toast.add({title: "成功", description: "修改成功", color: "success"})
    } else {
      await MenuAPI.create(payload)
      toast.add({title: "成功", description: "新增成功", color: "success"})
    }
    dialog.value.visible = false
    await handleQuery()
  } catch (error) {
    console.error(error)
  } finally {
    submittingMenu.value = false
  }
}

function addPerm() {
  if (!formData.value.perms) {
    formData.value.perms = []
  }
  formData.value.perms.push({})
}

function removePerm(index: number) {
  if (formData.value.perms) {
    formData.value.perms.splice(index, 1)
  }
}
</script>

<template>
  <ElDrawer v-model="slider.visible" :title="slider.title">
    <UForm class="gap-4 flex flex-col h-full" disabled>
      <UFormField label="父级菜单">
        <ElTreeSelect disabled :check-strictly="true" placeholder="选择上级菜单"
                      :render-after-expand="false" v-model="formData.parentId" :data="menuOptions"/>
      </UFormField>
      <UFormField label="菜单名称">
        <UInput class="w-full" v-model="formData.name"/>
      </UFormField>
      <UFormField label="菜单图标">
        <div class="flex gap-2 items-center">
          <UIcon class="size-5" :name="formData.icon??''"/>
          <UInput class="w-full" :modelValue="getIconInputValue(formData.icon)"
                  :ui="{
            base: 'pl-16.5',
            leading: 'pointer-events-none'
          }">
            <template #leading>
              <p class="text-sm text-muted">
                i-lucide-
              </p>
            </template>
          </UInput>
        </div>
      </UFormField>
      <template v-if="(formData.perms?.length ?? 0)===0 && mode==='show'">
        权限列表为空
      </template>
      <template v-else>
        <div class="flex flex-col h-full gap-2">
          <template v-for="(item, index) in formData.perms" :key="item.id ?? index">
            <div class="flex gap-2 items-center">
              <UFormField label="权限代码">
                <UInput v-model="item.value"/>
              </UFormField>
              <UFormField label="权限名称">
                <div class="flex gap-2 items-center">
                  <UInput class="w-full" v-model="item.label"/>
                </div>
              </UFormField>
            </div>
          </template>
        </div>
      </template>
    </UForm>
  </ElDrawer>
  <ElDialog :closeOnClickModal="false" v-model="dialog.visible" :title="dialog.title">
    <UTabs v-if="mode==='add'" v-model="tabActiveIndex" :items="tabs">
      <template #menu>
        <UForm class="gap-4 flex flex-col h-full">
          <UFormField label="父级菜单" required>
            <ElTreeSelect :check-strictly="true" :disabled="loadingMenuOptions" placeholder="选择上级菜单"
                          :render-after-expand="false" v-model="formData.parentId" :data="menuOptions"/>
          </UFormField>
          <div class="flex gap-2 items-center">
            <UFormField class="w-full" label="菜单名称" required>
              <UInput class="w-full" v-model="formData.name"/>
            </UFormField>
            <UFormField class="w-full" label="菜单图标">
              <div class="flex gap-2 items-center">
                <UIcon class="size-5" :name="formData.icon??''"/>
                <UInput class="w-full" :modelValue="getIconInputValue(formData.icon)"
                        @update:modelValue="setIconInputValue" :ui="{
              base: 'pl-16.5',
              leading: 'pointer-events-none'
            }">
                  <template #leading>
                    <p class="text-sm text-muted">
                      i-lucide-
                    </p>
                  </template>
                </UInput>
              </div>
            </UFormField>
          </div>
          <div class="flex gap-2 items-center">
            <UFormField class="w-full" label="路由名称" required>
              <UInput class="w-full" v-model="formData.routeName"/>
            </UFormField>
            <UFormField class="w-full" label="路由路径" required>
              <UInput class="w-full" v-model="formData.routePath"/>
            </UFormField>
            <UFormField class="w-full" label="组件路径" required>
              <UInput class="w-full" v-model="formData.component"/>
            </UFormField>
          </div>
          <div class="flex gap-2 justify-end">
            <UButton label="确定" :loading="submittingMenu" @click="handleSubmit" color="error" variant="outline"/>
            <UButton label="取消" @click="dialog.visible = false"/>
          </div>
        </UForm>
      </template>
      <template #catalog>
        <UForm class="gap-4 flex flex-col h-full">
          <UFormField label="父级菜单" required>
            <ElTreeSelect :check-strictly="true" :disabled="loadingMenuOptions" placeholder="选择上级菜单"
                          :render-after-expand="false" v-model="formData.parentId" :data="menuOptions"/>
          </UFormField>
          <div class="flex gap-2 items-center">
            <UFormField class="w-full" label="菜单名称" required>
              <UInput class="w-full" v-model="formData.name"/>
            </UFormField>
            <UFormField class="w-full" label="菜单图标">
              <div class="flex gap-2 items-center">
                <UIcon class="size-5" :name="formData.icon??''"/>
                <UInput class="w-full" :modelValue="getIconInputValue(formData.icon)"
                        @update:modelValue="setIconInputValue" :ui="{
              base: 'pl-16.5',
              leading: 'pointer-events-none'
            }">
                  <template #leading>
                    <p class="text-sm text-muted">
                      i-lucide-
                    </p>
                  </template>
                </UInput>
              </div>
            </UFormField>
          </div>
          <UFormField class="w-full" label="路由路径" required>
            <UInput class="w-full" :modelValue="getCatalogRoutePathValue(formData.routePath)"
                    @update:modelValue="setCatalogRoutePathValue" :ui="{
              base: 'pl-4',
              leading: 'pointer-events-none'
            }">
              <template #leading>
                <p class="text-sm text-muted">
                  /
                </p>
              </template>
            </UInput>
          </UFormField>
          <div class="flex gap-2 justify-end">
            <UButton label="确定" :loading="submittingMenu" @click="handleSubmit" color="error" variant="outline"/>
            <UButton label="取消" @click="dialog.visible = false"/>
          </div>
        </UForm>
      </template>
    </UTabs>
    <template v-if="mode==='edit'">
      <template v-if="tabActiveIndex === '0'">
        <UForm class="gap-4 flex flex-col h-full">
          <UFormField label="父级菜单" required>
            <ElTreeSelect :check-strictly="true" :disabled="loadingMenuOptions" placeholder="选择上级菜单"
                          :render-after-expand="false" v-model="formData.parentId" :data="menuOptions"/>
          </UFormField>
          <div class="flex gap-2 items-center">
            <UFormField class="w-full" label="菜单名称" required>
              <UInput class="w-full" v-model="formData.name"/>
            </UFormField>
            <UFormField class="w-full" label="菜单图标">
              <div class="flex gap-2 items-center">
                <UIcon class="size-5" :name="formData.icon??''"/>
                <UInput class="w-full" :modelValue="getIconInputValue(formData.icon)"
                        @update:modelValue="setIconInputValue" :ui="{
              base: 'pl-16.5',
              leading: 'pointer-events-none'
            }">
                  <template #leading>
                    <p class="text-sm text-muted">
                      i-lucide-
                    </p>
                  </template>
                </UInput>
              </div>
            </UFormField>
          </div>
          <div class="flex gap-2 items-center">
            <UFormField class="w-full" label="路由名称" required>
              <UInput class="w-full" v-model="formData.routeName"/>
            </UFormField>
            <UFormField class="w-full" label="路由路径" required>
              <UInput class="w-full" v-model="formData.routePath"/>
            </UFormField>
            <UFormField class="w-full" label="组件路径" required>
              <UInput class="w-full" v-model="formData.component"/>
            </UFormField>
          </div>
          <template v-for="(item,index) in formData.perms" :key="item.id ?? index">
            <div class="flex gap-2 items-center">
              <UFormField class="w-full" label="权限代码">
                <UInput class="w-full" v-model="item.value"/>
              </UFormField>
              <UFormField class="w-full" label="权限名称">
                <div class="flex gap-2 items-center">
                  <UInput class="w-full" v-model="item.label"/>
                  <UButton icon="i-lucide-x" @click="removePerm(index)" color="error"
                           variant="ghost"/>
                </div>
              </UFormField>
            </div>
          </template>
          <UButton class="w-fit" @click="addPerm" variant="outline">添加权限</UButton>
          <div class="flex gap-2 justify-end">
            <UButton label="确定" :loading="submittingMenu" @click="handleSubmit" color="error" variant="outline"/>
            <UButton label="取消" @click="dialog.visible = false"/>
          </div>
        </UForm>
      </template>
      <template v-else-if="tabActiveIndex === '1'">
        <UForm class="gap-4 flex flex-col h-full">
          <UFormField label="父级菜单" required>
            <ElTreeSelect :check-strictly="true" :disabled="loadingMenuOptions" placeholder="选择上级菜单"
                          :render-after-expand="false" v-model="formData.parentId" :data="menuOptions"/>
          </UFormField>
          <div class="flex gap-2 items-center">
            <UFormField class="w-full" label="菜单名称" required>
              <UInput class="w-full" v-model="formData.name"/>
            </UFormField>
            <UFormField class="w-full" label="菜单图标">
              <div class="flex gap-2 items-center">
                <UIcon class="size-5" :name="formData.icon??''"/>
                <UInput class="w-full" :modelValue="getIconInputValue(formData.icon)"
                        @update:modelValue="setIconInputValue" :ui="{
              base: 'pl-16.5',
              leading: 'pointer-events-none'
            }">
                  <template #leading>
                    <p class="text-sm text-muted">
                      i-lucide-
                    </p>
                  </template>
                </UInput>
              </div>
            </UFormField>
          </div>
          <UFormField class="w-full" label="路由路径" required>
            <UInput class="w-full" :modelValue="getCatalogRoutePathValue(formData.routePath)"
                    @update:modelValue="setCatalogRoutePathValue" :ui="{
              base: 'pl-4',
              leading: 'pointer-events-none'
            }">
              <template #leading>
                <p class="text-sm text-muted">
                  /
                </p>
              </template>
            </UInput>
          </UFormField>
          <div class="flex gap-2 justify-end">
            <UButton label="确定" :loading="submittingMenu" @click="handleSubmit" color="error" variant="outline"/>
            <UButton label="取消" @click="dialog.visible = false"/>
          </div>
        </UForm>
      </template>
    </template>
  </ElDialog>
  <UCard class="flex h-full min-h-0 flex-col" :ui="{ body: 'flex-1 min-h-0' }">
    <template #header>
      <div class="space-y-3">
        <ActionGroup :table="table" @flush="handleQuery"
                     @add-row="openAddMenu(0)" @modify-row="editSelectedMenu" @delete-row="deleteMenu()"
        />
        <UForm @submit.prevent="handleQuery" class="w-full">
          <div class="flex flex-wrap items-center gap-2">
            <UInput
                v-model="searchForm.keywords"
                icon="i-lucide-search"
                size="md"
                variant="outline"
                class="w-72"
                placeholder="搜索菜单名称/路由名称"
            />
            <UButton type="submit" icon="i-lucide-search" :loading="loadingMenuList" label="搜索"/>
            <UButton type="button" variant="ghost" icon="i-lucide-rotate-ccw" :disabled="loadingMenuList" label="重置" @click="resetQuery"/>
          </div>
        </UForm>
      </div>
    </template>
    <UTable ref="table" :data="menuTableData" :get-sub-rows="(row)=>row.children"
            :column-visibility="columnVisibility" :columns="columns"
            class="h-full"
            :loading="loadingMenuList"
            loading-color="primary"
            loading-animation="carousel"
            virtualize
            @select="showMenuInfo"
            :ui="{
      base: 'border-separate border-spacing-0',
      tbody: '[&>tr]:last:[&>td]:border-b-0',
      tr: 'group',
      td: 'empty:p-0 group-has-[td:not(:empty)]:border-b border-default'
    }"
    />
  </UCard>
</template>

<style scoped>

</style>
