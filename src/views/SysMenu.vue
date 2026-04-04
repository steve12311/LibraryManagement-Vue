<script setup lang="ts">
import {h, onMounted, ref, resolveComponent, useTemplateRef, watch} from "vue";
import {type MenuForm, type MenuVO} from "@/api/system/menu-api.ts";
import type {TableColumn} from "@nuxt/ui";
import {MenuTypeEnum} from "@/enums/system/menu-enum.ts";
import {ElTreeSelect, ElDrawer, ElDialog} from "element-plus";
import WarningModal from "@/components/WarningModal.vue";
import {useMenuActions} from "@/composables/system/menu/useMenuActions";
import {useMenuDialog} from "@/composables/system/menu/useMenuDialog";
import {useMenuQuery} from "@/composables/system/menu/useMenuQuery";
import {useMenuSubmit} from "@/composables/system/menu/useMenuSubmit";
import {
  createMenuForm,
  getCatalogRoutePathValue,
  getIconInputValue,
  useMenuForm,
} from "@/composables/system/menu/useMenuForm";

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
const {searchForm, menuTableData, loadingMenuList, handleQuery, resetQuery} = useMenuQuery()
const table = useTemplateRef("table");
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
const formData = ref<MenuForm>(createMenuForm());
const {setIconInputValue, setCatalogRoutePathValue, normalizeMenuPayload} = useMenuForm(formData)
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
const {
  mode,
  slider,
  dialog,
  menuOptions,
  loadingMenuOptions,
  showMenuInfo,
  openAddMenu,
  openEditByRow,
} = useMenuDialog(formData, tabActiveIndex)
const {editSelectedMenu, deleteMenu} = useMenuActions({
  table,
  modal,
  openEditByRow,
  handleQuery,
})
const {handleSubmit, addPerm, removePerm} = useMenuSubmit(
  formData,
  dialog,
  submittingMenu,
  handleQuery,
  normalizeMenuPayload,
)

watch(tabActiveIndex, (value) => {
  if (value === "0") {
    formData.value.type = MenuTypeEnum.MENU;
  } else if (value === "1") {
    formData.value.type = MenuTypeEnum.CATALOG;
  }
}, {immediate: true})

</script>

<template>
  <ElDrawer v-model="slider.visible" :title="slider.title" class="menu-detail-drawer">
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
  <ElDialog :closeOnClickModal="false" v-model="dialog.visible" :title="dialog.title" class="menu-edit-dialog">
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
  <UCard
      class="system-page-card flex h-full min-h-0 flex-col"
      :ui="{ header: 'p-6 pb-0', body: 'flex-1 min-h-0 p-6 pt-0', footer: 'px-6 pb-6 pt-4' }"
  >
    <template #header>
      <div class="page-header">
        <div class="page-copy">
          <p class="page-kicker">MENU GOVERNANCE</p>
          <h1 class="page-title">菜单管理</h1>
          <p class="page-description">统一维护目录、菜单、按钮权限及其路由配置。</p>
        </div>
        <div class="page-stats">
          <div class="stat-item">
            <span class="stat-label">顶层节点</span>
            <strong class="stat-value">{{ menuTableData.length }}</strong>
          </div>
          <div class="stat-item">
            <span class="stat-label">表格列数</span>
            <strong class="stat-value">{{ columns.length }}</strong>
          </div>
          <div class="stat-item">
            <span class="stat-label">搜索状态</span>
            <strong class="stat-value">{{ searchForm.keywords?.trim() ? "已筛选" : "全部" }}</strong>
          </div>
        </div>
      </div>

      <div class="query-card">
        <div class="action-row">
          <ActionGroup :table="table" @flush="handleQuery"
                       @add-row="openAddMenu(0)" @modify-row="editSelectedMenu" @delete-row="deleteMenu()"
          />
        </div>
        <UForm @submit.prevent="handleQuery" class="w-full">
          <div class="query-row">
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
    <div class="table-card">
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
    </div>
    <template #footer>
      <div class="page-footer">
        <p class="footer-summary">当前展示 {{ menuTableData.length }} 个顶层菜单节点</p>
      </div>
    </template>
  </UCard>
</template>

<style scoped>
.system-page-card {
  border: 0;
  border-radius: 28px;
  background: rgb(255 255 255 / 96%);
  box-shadow: var(--library-shadow-soft);
}

.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.page-kicker,
.stat-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--library-accent);
}

.page-title {
  margin-top: 6px;
  font-size: 30px;
  font-weight: 800;
  color: var(--library-text);
}

.page-description,
.footer-summary {
  color: var(--library-text-muted);
}

.page-description {
  margin-top: 8px;
  font-size: 14px;
}

.page-stats {
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  min-width: min(100%, 320px);
}

.stat-item {
  border-radius: 18px;
  padding: 14px 16px;
  background: var(--library-card-muted);
}

.stat-value {
  display: block;
  margin-top: 6px;
  font-size: 24px;
  font-weight: 800;
  color: var(--library-text);
}

.query-card {
  border-radius: 24px;
  padding: 18px;
  background: rgb(245 249 252 / 88%);
}

.action-row {
  margin-bottom: 14px;
}

.query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.table-card {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  border-radius: 24px;
  background: rgb(255 255 255 / 88%);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 72%);
}

.page-footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

:deep(.menu-edit-dialog) {
  border-radius: 28px;
  overflow: hidden;
}

:deep(.menu-detail-drawer) {
  border-top-left-radius: 28px;
  border-bottom-left-radius: 28px;
}

:deep(thead tr) {
  background: rgb(243 247 250 / 92%);
}

:deep(th) {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--library-text-muted);
}

:deep(tbody tr) {
  transition: background-color 180ms ease;
}

:deep(tbody tr:hover) {
  background: rgb(245 249 252 / 82%);
}

@media (max-width: 960px) {
  .page-stats {
    width: 100%;
    grid-template-columns: 1fr;
  }
}
</style>
