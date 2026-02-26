<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, useTemplateRef, watchEffect} from "vue";
import MenuAPI, {type MenuForm, type MenuQuery, type MenuVO} from "@/api/system/menu-api.ts";
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
const menuTableData = ref<MenuVO[]>([]);
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
          onClick: (ev: any) => {
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
                  editMenu(row.original.id)
                }
              }),
            ])
          }
        })(),
        h(UTooltip, {text: "修改", delayDuration: 0}, () => [
          h(UButton, {
            icon: "i-lucide-clipboard-pen-line", variant: "ghost", onClick: () => {
              tabActiveIndex.value = row.original.type === MenuTypeEnum.MENU ? "0" : "1"
              editMenu(row.original.parentId, row.original.id)
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
const emptyMenuFormData = ref<MenuForm>({
  id: undefined,
  parentId: 0,
  visible: 1,
  sort: 1,
  type: MenuTypeEnum.MENU, // 默认菜单
  alwaysShow: 0,
  keepAlive: 1,
  perms: [],
  params: [],
})
const initialMenuFormData = ref<MenuForm>({
  id: undefined,
  parentId: 0,
  visible: 1,
  sort: 1,
  type: MenuTypeEnum.MENU, // 默认菜单
  alwaysShow: 0,
  keepAlive: 1,
  perms: [],
  params: [],
})
// 菜单表单数据
const formData = ref({...initialMenuFormData.value});
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

watchEffect(() => {
  if (tabActiveIndex.value === "0") {
    formData.value.type = MenuTypeEnum.MENU;
  } else if (tabActiveIndex.value === "1") {
    formData.value.type = MenuTypeEnum.CATALOG;
  }
})

// 查询菜单
function handleQuery() {
  MenuAPI.getList(queryParams)
      .then((data) => {
        menuTableData.value = data;
      })
      .catch((error) => {
        console.error(error);
      })
}

function showMenuInfo(_: any, row: TableRow<MenuVO>) {
  mode.value = "show";
  if (row.original.type == MenuTypeEnum.MENU) {
    handleOpenSlider(void 0, row.original.id)
  }
}

function editMenu(parentId?: number, menuId?: number) {
  mode.value = "edit";
  handleOpenSlider(parentId, menuId)
}

async function deleteMenu() {
  const instance = modal.open({
    content: "确定要删除吗？",
  })
  if (await instance) {
    const deleteIds: number[] = []
    const formDeleteArray = table.value?.tableApi?.getFilteredSelectedRowModel().flatRows ?? []
    for (const row of formDeleteArray) {
      deleteIds.push(row.original.id!)
    }
    MenuAPI.delete(deleteIds).then(() => {
      const toast = useToast();
      handleQuery()
      toast.add({title: "成功", description: "删除成功", color: "success"})
    })
    return
  }
  table.value?.tableApi?.toggleAllPageRowsSelected(false)
}

function handleOpenSlider(parentId?: number, menuId?: number) {
  MenuAPI.getOptions(true)
      .then((data) => {
        menuOptions.value = [{value: 0, label: "顶级菜单", children: data}];
      })
      .then(() => {
        if (menuId) {
          MenuAPI.getFormData(menuId).then((data) => {
            initialMenuFormData.value = {...data};
            formData.value = data;
            if (mode.value === 'show') {
              slider.value.visible = true;
            } else if (mode.value === 'edit') {
              dialog.value.title = "编辑菜单"
              dialog.value.visible = true;
            }
          });
        } else {
          formData.value = {...emptyMenuFormData.value, parentId};
          mode.value = "add";
          dialog.value.title = "新增菜单";
          dialog.value.visible = true;
        }
      })
}

function handleSubmit() {
  const menuId = formData.value.id
  const toast = useToast()
  if (formData.value.type == MenuTypeEnum.MENU && formData.value.parentId == 0) {
    toast.add({title: "错误", description: "顶级菜单不能为菜单", color: "error"})
    return;
  }
  if (menuId) {
    if (formData.value.parentId == menuId) {
      toast.add({title: "错误", description: "父级菜单不能为当前菜单", color: "error"})
      return;
    }
    MenuAPI.update(menuId!, formData.value)
        .then(() => {
          handleQuery()
          toast.add({title: "成功", description: "修改成功", color: "success"})
        })
  } else {
    MenuAPI.create(formData.value)
        .then(() => {
          handleQuery()
          toast.add({title: "成功", description: "新增成功", color: "success"})
        })
  }
  dialog.value.visible = false
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
          <UInput class="w-full" :modelValue="formData.icon?.replace('i-lucide-', '')"
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
      <template v-if="formData.perms.length===0 && mode==='show'">
        权限列表为空
      </template>
      <template v-else>
        <div class="flex flex-col h-full gap-2">
          <template v-for="(item) in formData.perms">
            <div class="flex gap-2 items-center">
              <UInput :modelValue="(()=>{item.parentId = formData.id;return item.parentId})()" class="hidden"/>
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
            <ElTreeSelect :check-strictly="true" placeholder="选择上级菜单"
                          :render-after-expand="false" v-model="formData.parentId" :data="menuOptions"/>
          </UFormField>
          <div class="flex gap-2 items-center">
            <UFormField class="w-full" label="菜单名称" required>
              <UInput class="w-full" v-model="formData.name"/>
            </UFormField>
            <UFormField class="w-full" label="菜单图标">
              <div class="flex gap-2 items-center">
                <UIcon class="size-5" :name="formData.icon??''"/>
                <UInput class="w-full" :modelValue="formData.icon?.replace('i-lucide-', '')"
                        @update:modelValue="(val) => {formData.icon = 'i-lucide-' + val}" :ui="{
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
            <UButton label="确定" @click="handleSubmit" color="error" variant="outline"/>
            <UButton label="取消" @click="dialog.visible = false"/>
          </div>
        </UForm>
      </template>
      <template #catalog>
        <UForm class="gap-4 flex flex-col h-full">
          <UFormField label="父级菜单" required>
            <ElTreeSelect :check-strictly="true" placeholder="选择上级菜单"
                          :render-after-expand="false" v-model="formData.parentId" :data="menuOptions"/>
          </UFormField>
          <div class="flex gap-2 items-center">
            <UFormField class="w-full" label="菜单名称" required>
              <UInput class="w-full" v-model="formData.name"/>
            </UFormField>
            <UFormField class="w-full" label="菜单图标">
              <div class="flex gap-2 items-center">
                <UIcon class="size-5" :name="formData.icon??''"/>
                <UInput class="w-full" :modelValue="formData.icon?.replace('i-lucide-', '')"
                        @update:modelValue="(val) => {formData.icon = 'i-lucide-' + val}" :ui="{
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
            <UInput class="w-full" :modelValue="formData.routePath?.replace('/', '')"
                    @update:modelValue="(val) => {formData.routePath = val}" :ui="{
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
            <UButton label="确定" @click="handleSubmit" color="error" variant="outline"/>
            <UButton label="取消" @click="dialog.visible = false"/>
          </div>
        </UForm>
      </template>
    </UTabs>
    <template v-if="mode==='edit'">
      <template v-if="tabActiveIndex === '0'">
        <UForm class="gap-4 flex flex-col h-full">
          <UFormField label="父级菜单" required>
            <ElTreeSelect :check-strictly="true" placeholder="选择上级菜单"
                          :render-after-expand="false" v-model="formData.parentId" :data="menuOptions"/>
          </UFormField>
          <div class="flex gap-2 items-center">
            <UFormField class="w-full" label="菜单名称" required>
              <UInput class="w-full" v-model="formData.name"/>
            </UFormField>
            <UFormField class="w-full" label="菜单图标">
              <div class="flex gap-2 items-center">
                <UIcon class="size-5" :name="formData.icon??''"/>
                <UInput class="w-full" :modelValue="formData.icon?.replace('i-lucide-', '')"
                        @update:modelValue="(val) => {formData.icon = 'i-lucide-' + val}" :ui="{
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
          <template v-for="(item,index) in formData.perms">
            <div class="flex gap-2 items-center">
              <UInput :modelValue="(()=>{item.parentId = formData.id;return item.parentId})()" class="hidden"/>
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
            <UButton label="确定" @click="handleSubmit" color="error" variant="outline"/>
            <UButton label="取消" @click="dialog.visible = false"/>
          </div>
        </UForm>
      </template>
      <template v-else-if="tabActiveIndex === '1'">
        <UForm class="gap-4 flex flex-col h-full">
          <UFormField label="父级菜单" required>
            <ElTreeSelect :check-strictly="true" placeholder="选择上级菜单"
                          :render-after-expand="false" v-model="formData.parentId" :data="menuOptions"/>
          </UFormField>
          <div class="flex gap-2 items-center">
            <UFormField class="w-full" label="菜单名称" required>
              <UInput class="w-full" v-model="formData.name"/>
            </UFormField>
            <UFormField class="w-full" label="菜单图标">
              <div class="flex gap-2 items-center">
                <UIcon class="size-5" :name="formData.icon??''"/>
                <UInput class="w-full" :modelValue="formData.icon?.replace('i-lucide-', '')"
                        @update:modelValue="(val) => {formData.icon = 'i-lucide-' + val}" :ui="{
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
            <UInput class="w-full" :modelValue="formData.routePath?.replace('/', '')"
                    @update:modelValue="(val) => {formData.routePath = val}" :ui="{
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
            <UButton label="确定" @click="handleSubmit" color="error" variant="outline"/>
            <UButton label="取消" @click="dialog.visible = false"/>
          </div>
        </UForm>
      </template>
    </template>
  </ElDialog>
  <UCard>
    <template #header>
      <ActionGroup :table="table" @flush="handleQuery"
                   @addRow="editMenu(0)" @deleteRow="deleteMenu()"
      />
    </template>
    <UTable ref="table" :data="menuTableData" :get-sub-rows="(row)=>row.children"
            :column-visibility="columnVisibility" :columns="columns"
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