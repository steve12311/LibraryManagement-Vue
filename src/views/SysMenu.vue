<script setup lang="ts">
import {h, onMounted, reactive, ref, resolveComponent, useTemplateRef} from "vue";
import MenuAPI, {type MenuForm, type MenuQuery, type MenuVO} from "../api/menu-api.ts";
import type {TableColumn, TableRow} from "@nuxt/ui";
import {MenuTypeEnum} from "../enums/system/menu-enum.ts";

onMounted(() => {
  handleQuery()
})

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UFieldGroup = resolveComponent('UFieldGroup')
const UTooltip = resolveComponent('UTooltip')

const sliderStatus = ref(false)
const table = useTemplateRef("table");
const queryParams = reactive<MenuQuery>({});
const menuTableData = ref<MenuVO[]>([]);
const columnVisibility = ref({
  id: false,
})
const columns = ref<TableColumn<MenuVO>[]>([
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
    cell: () => {
      return h(UFieldGroup, undefined, () => [
        h(UTooltip, {text: "新增", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-plus", variant: "ghost"}),
        ]),
        h(UTooltip, {text: "修改", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-clipboard-pen-line", variant: "ghost"}),
        ]),
        h(UTooltip, {text: "删除", delayDuration: 0}, () => [
          h(UButton, {icon: "i-lucide-trash-2", variant: "ghost"}),
        ])
      ])
    }
  }
])
const menuOptions = ref<OptionType[]>([])
const initialMenuFormData = ref<MenuForm>({
  id: undefined,
  parentId: "0",
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
  if (row.original.type !== MenuTypeEnum.CATALOG) {
    handleOpenSlider(void 0, row.original.id)
  }
}

function handleOpenSlider(parentId?: string, menuId?: string) {
  MenuAPI.getOptions(true)
      .then((data) => {
        menuOptions.value = [{value: 0, label: "顶级菜单", children: data}];
      })
      .then(() => {
        if (menuId) {
          MenuAPI.getFormData(menuId).then((data) => {
            initialMenuFormData.value = {...data};
            formData.value = data;
            sliderStatus.value = true
          });
        }
      })
}

function addPerm() {
  if (!formData.value.perms) {
    formData.value.perms = []
  }
  formData.value.perms.push({})
}

function removePerm() {
  if (formData.value.perms) {
    formData.value.perms.pop()
  }
}
</script>

<template>
  <UCard>
    <USlideover v-model:open="sliderStatus" title="菜单信息">
      <template #body>
        <UForm class="gap-4 flex flex-col" disabled>
          <UFormField label="父级菜单">
            <SelectTreeMenu :items="menuOptions" v-model:selectValue="formData.parentId"/>
          </UFormField>
          <UFormField label="菜单名称">
            <UInput class="w-full" v-model="formData.name"/>
          </UFormField>
          <template v-if="formData.perms.length===0">
            权限列表为空
          </template>
          <template v-for="item in formData.perms">
            <div class="flex gap-2">
              <UFormField label="权限代码">
                <UInput v-model="item.value"/>
              </UFormField>
              <UFormField label="权限名称">
                <UInput v-model="item.label"/>
              </UFormField>
            </div>
          </template>
        </UForm>
      </template>
    </USlideover>
    <template #header>
      <ActionGroup :table="table" @flush="handleQuery"/>
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