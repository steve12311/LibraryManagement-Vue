import { computed, ref } from "vue";
import UserAPI, { type UserImportResultVO, type UserPageQuery } from "@/api/system/user-api";

interface UseUserImportExportOptions {
  fetchData: () => Promise<void>;
  getExportQuery: () => UserPageQuery | undefined;
}

/** 用户导入导出：下载模板、提交导入文件、导出当前查询结果 */
export function useUserImportExport(options: UseUserImportExportOptions) {
  const toast = useToast();

  const openImportModal = ref(false);
  const openImportResultModal = ref(false);
  const importFileModel = ref<File | null>(null);
  const downloadingTemplate = ref(false);
  const importingUsers = ref(false);
  const exportingUsers = ref(false);
  const importResult = ref<UserImportResultVO>({
    totalCount: 0,
    successCount: 0,
    failureCount: 0,
    messages: [],
  });

  const importSummary = computed(() => {
    const result = importResult.value;
    return `共 ${result.totalCount} 条，成功 ${result.successCount} 条，失败 ${result.failureCount} 条`;
  });

  function resetImportState() {
    importFileModel.value = null;
    importResult.value = {
      totalCount: 0,
      successCount: 0,
      failureCount: 0,
      messages: [],
    };
  }

  function resetImportFile() {
    importFileModel.value = null;
  }

  async function downloadTemplate() {
    try {
      downloadingTemplate.value = true;
      await UserAPI.downloadTemplate();
      toast.add({ title: "成功", description: "模板下载已开始", color: "success" });
    } catch {
      toast.add({ title: "错误", description: "模板下载失败", color: "error" });
    } finally {
      downloadingTemplate.value = false;
    }
  }

  async function submitImportUsers() {
    const file = importFileModel.value ?? void 0;

    if (!file) {
      toast.add({ title: "错误", description: "请先选择导入文件", color: "error" });
      return;
    }

    try {
      importingUsers.value = true;
      const result = await UserAPI.importUsers(file);
      importResult.value = {
        totalCount: result.totalCount ?? 0,
        successCount: result.successCount ?? 0,
        failureCount: result.failureCount ?? 0,
        messages: Array.isArray(result.messages) ? result.messages : [],
      };
      openImportModal.value = false;
      openImportResultModal.value = true;
      await options.fetchData();

      const description = importResult.value.failureCount > 0
        ? `导入完成，${importSummary.value}`
        : `导入成功，${importSummary.value}`;
      toast.add({
        title: importResult.value.failureCount > 0 ? "部分成功" : "成功",
        description,
        color: importResult.value.failureCount > 0 ? "warning" : "success",
      });
    } catch {
      toast.add({ title: "错误", description: "导入失败", color: "error" });
    } finally {
      importingUsers.value = false;
    }
  }

  async function exportUsers() {
    try {
      exportingUsers.value = true;
      await UserAPI.exportUsers(options.getExportQuery());
      toast.add({ title: "成功", description: "导出已开始", color: "success" });
    } catch {
      toast.add({ title: "错误", description: "导出失败", color: "error" });
    } finally {
      exportingUsers.value = false;
    }
  }

  return {
    openImportModal,
    openImportResultModal,
    importFileModel,
    downloadingTemplate,
    importingUsers,
    exportingUsers,
    importResult,
    importSummary,
    resetImportState,
    resetImportFile,
    downloadTemplate,
    submitImportUsers,
    exportUsers,
  };
}
