import type {Ref} from "vue";
import MenuAPI, {type MenuForm} from "@/api/system/menu-api";
import {MenuTypeEnum} from "@/enums/system/menu-enum";

type DialogState = {
  visible: boolean;
};

type QueryHandler = () => Promise<void> | void;

type PayloadFactory = () => MenuForm;

/**
 * 菜单表单提交逻辑。
 * handleSubmit 流程：规范化 → 类型校验（目录/菜单/按钮规则）→ 自引用检查 → API 调用（新增/修改）
 */
export function useMenuSubmit(
  formData: Ref<MenuForm>,
  dialog: Ref<DialogState>,
  submittingMenu: Ref<boolean>,
  handleQuery: QueryHandler,
  normalizeMenuPayload: PayloadFactory,
) {
  const toast = useToast();

  async function handleSubmit() {
    if (submittingMenu.value) return;

    const payload = normalizeMenuPayload();
    const menuId = payload.id;

    // 类型校验
    if (payload.type == MenuTypeEnum.MENU && Number(payload.parentId) === 0) {
      toast.add({title: "错误", description: "顶级菜单不能为菜单", color: "error"});
      return;
    }
    if (!payload.name?.trim()) {
      toast.add({title: "错误", description: "菜单名称不能为空", color: "error"});
      return;
    }

    // 菜单类型字段校验
    if (payload.type === MenuTypeEnum.MENU && (!payload.routeName || !payload.routePath || !payload.component)) {
      toast.add({title: "错误", description: "菜单的路由名称、路径、组件不能为空", color: "error"});
      return;
    }
    if (payload.type === MenuTypeEnum.CATALOG && !payload.routePath) {
      toast.add({title: "错误", description: "目录的路由路径不能为空", color: "error"});
      return;
    }

    // 自引用检查：父级不能是自身
    if (menuId !== undefined && menuId !== null && Number(payload.parentId) === menuId) {
      toast.add({title: "错误", description: "父级菜单不能为当前菜单", color: "error"});
      return;
    }

    // API 调用：新增 vs 修改
    try {
      submittingMenu.value = true;
      if (menuId !== undefined && menuId !== null) {
        await MenuAPI.update(menuId, payload);
        toast.add({title: "成功", description: "修改成功", color: "success"});
      } else {
        await MenuAPI.create(payload);
        toast.add({title: "成功", description: "新增成功", color: "success"});
      }
      dialog.value.visible = false;
      await handleQuery();
    } catch {
      toast.add({title: "错误", description: "提交失败", color: "error"});
    } finally {
      submittingMenu.value = false;
    }
  }

  function addPerm() {
    if (!formData.value.perms) {
      formData.value.perms = [];
    }
    formData.value.perms.push({});
  }

  function removePerm(index: number) {
    if (formData.value.perms) {
      formData.value.perms.splice(index, 1);
    }
  }

  return {
    handleSubmit,
    addPerm,
    removePerm,
  };
}
