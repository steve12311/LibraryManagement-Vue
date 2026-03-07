import type {Ref} from "vue";
import MenuAPI, {type MenuId, type MenuVO} from "@/api/system/menu-api";

type MenuTableRow = {
  original: MenuVO;
};

type TableLike = {
  tableApi?: {
    getFilteredSelectedRowModel: () => {
      flatRows?: MenuTableRow[];
    };
    toggleAllPageRowsSelected: (value: boolean) => void;
  };
};

type ModalLike = {
  open: (options: {content: string}) => Promise<unknown>;
};

interface UseMenuActionsOptions {
  table: Readonly<Ref<TableLike | null | undefined>>;
  modal: ModalLike;
  openEditByRow: (row: MenuVO) => void;
  handleQuery: () => Promise<void> | void;
}

export function useMenuActions(options: UseMenuActionsOptions) {
  const toast = useToast();

  function editSelectedMenu() {
    const selectedRows = options.table.value?.tableApi?.getFilteredSelectedRowModel().flatRows ?? [];
    if (selectedRows.length !== 1) {
      toast.add({title: "错误", description: "请选择一条菜单进行修改", color: "error"});
      return;
    }
    const selectedRow = selectedRows[0];
    if (!selectedRow) {
      return;
    }
    options.openEditByRow(selectedRow.original);
  }

  async function deleteMenu() {
    const selectedRows = options.table.value?.tableApi?.getFilteredSelectedRowModel().flatRows ?? [];
    const deleteIds = selectedRows
      .map((row) => row.original.id)
      .filter((id): id is MenuId => id !== undefined && id !== null);

    if (!deleteIds.length) {
      toast.add({title: "错误", description: "请选择需要删除的菜单", color: "error"});
      return;
    }

    const instance = await options.modal.open({
      content: "确定要删除吗？",
    });
    if (!instance) {
      options.table.value?.tableApi?.toggleAllPageRowsSelected(false);
      return;
    }

    try {
      await MenuAPI.delete(deleteIds);
      await options.handleQuery();
      toast.add({title: "成功", description: "删除成功", color: "success"});
    } catch (error: unknown) {
      void error;
    } finally {
      options.table.value?.tableApi?.toggleAllPageRowsSelected(false);
    }
  }

  return {
    editSelectedMenu,
    deleteMenu,
  };
}
