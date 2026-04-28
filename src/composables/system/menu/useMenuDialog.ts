import {ref, type Ref} from "vue";
import MenuAPI, {type MenuForm, type MenuId, type MenuVO} from "@/api/system/menu-api";
import {MenuTypeEnum} from "@/enums/system/menu-enum";
import {createMenuForm, normalizeMenuFormFromApi} from "@/composables/system/menu/useMenuForm";

type DialogMode = "add" | "edit" | "show";

type DialogStatus = {
  visible: boolean;
  title: string;
};

type MenuTableRow = {
  original: MenuVO;
};

/** 菜单弹窗管理：新增/编辑/查看，拉取菜单选项树+表单数据 */
export function useMenuDialog(formData: Ref<MenuForm>, tabActiveIndex: Ref<string>) {
  const toast = useToast();
  const mode = ref<DialogMode>("show");
  const slider = ref<DialogStatus>({
    visible: false,
    title: "菜单详情",
  });
  const dialog = ref<DialogStatus>({
    visible: false,
    title: "新增菜单",
  });
  const menuOptions = ref<OptionType[]>([]);
  const loadingMenuOptions = ref(false);

  function showMenuInfo(_: unknown, row: MenuTableRow) {
    const menuId = row.original.id;
    if (row.original.type !== MenuTypeEnum.MENU || menuId === undefined || menuId === null) {
      return;
    }
    mode.value = "show";
    void openMenuDialog(void 0, menuId);
  }

  function openAddMenu(parentId: MenuId = 0) {
    mode.value = "add";
    tabActiveIndex.value = "0";
    void openMenuDialog(parentId);
  }

  function openEditByRow(row: MenuVO) {
    if (row.id === undefined || row.id === null) {
      toast.add({title: "错误", description: "菜单ID不存在，无法编辑", color: "error"});
      return;
    }
    tabActiveIndex.value = row.type === MenuTypeEnum.CATALOG ? "1" : "0";
    editMenu(row.parentId, row.id);
  }

  function editMenu(parentId?: MenuId, menuId?: MenuId) {
    mode.value = "edit";
    void openMenuDialog(parentId, menuId);
  }

  async function openMenuDialog(parentId?: MenuId, menuId?: MenuId) {
    loadingMenuOptions.value = true;
    try {
      const options = await MenuAPI.getOptions(true);
      menuOptions.value = [{value: 0, label: "顶级菜单", children: options}];

      if (menuId === undefined || menuId === null) {
        formData.value = createMenuForm({
          parentId: Number(parentId ?? 0),
          type: tabActiveIndex.value === "1" ? MenuTypeEnum.CATALOG : MenuTypeEnum.MENU,
        });
        dialog.value.title = "新增菜单";
        dialog.value.visible = true;
        return;
      }

      const data = await MenuAPI.getFormData(menuId);
      formData.value = normalizeMenuFormFromApi(data, parentId);
      tabActiveIndex.value = formData.value.type === MenuTypeEnum.CATALOG ? "1" : "0";
      if (mode.value === "show") {
        slider.value.visible = true;
      } else {
        dialog.value.title = "编辑菜单";
        dialog.value.visible = true;
      }
    } catch {
      toast.add({title: "错误", description: "菜单信息加载失败", color: "error"});
    } finally {
      loadingMenuOptions.value = false;
    }
  }

  return {
    mode,
    slider,
    dialog,
    menuOptions,
    loadingMenuOptions,
    showMenuInfo,
    openAddMenu,
    openEditByRow,
    editMenu,
    openMenuDialog,
  };
}
