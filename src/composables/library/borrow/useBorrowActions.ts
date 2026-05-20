import type { Ref } from "vue";
import type { BorrowForm } from "@/api/library/borrow-api";
import borrowApi from "@/api/library/borrow-api";
import { ElMessageBox } from "element-plus";
import type { CalendarDate } from "@internationalized/date";

interface UseBorrowActionsOptions {
  state: Ref<BorrowForm>;
  returnTime: Ref<CalendarDate>;
  open: Ref<boolean>;
  openConfirm: Ref<boolean>;
  selectedDelayBorrowId: Ref<string>;
  selectedDelayReturnTime: Ref<Date | null>;
  delayDay: Ref<number>;
  submittingBorrow: Ref<boolean>;
  submittingDelay: Ref<boolean>;
  returningBorrowId: Ref<string>;
  fetchData: () => Promise<void>;
}

export function useBorrowActions(options: UseBorrowActionsOptions) {
  const toast = useToast();

  async function submitForm() {
    const isbn = String(options.state.value.isbn ?? "").trim();
    if (!isbn) {
      toast.add({ title: "错误", description: "ISBN不能为空", color: "error" });
      return;
    }
    const userIdNumber = Number(options.state.value.userId ?? "");
    if (!Number.isFinite(userIdNumber) || userIdNumber <= 0) {
      toast.add({ title: "错误", description: "借阅用户无效", color: "error" });
      return;
    }
    const payload: BorrowForm = {
      ...options.state.value,
      isbn,
      userId: userIdNumber,
      returnTime: new Date(options.returnTime.value.toString()),
    };
    try {
      options.submittingBorrow.value = true;
      await borrowApi.create(payload);
      toast.add({ title: "成功", description: "新增成功", color: "success" });
      options.open.value = false;
      await options.fetchData();
    } catch {
      toast.add({ title: "错误", description: "新增借阅失败", color: "error" });
    } finally {
      options.submittingBorrow.value = false;
    }
  }

  async function submitDelayDay() {
    if (!options.selectedDelayBorrowId.value) {
      toast.add({ title: "错误", description: "借阅单不存在", color: "error" });
      return;
    }
    if (options.delayDay.value <= 0) {
      toast.add({ title: "错误", description: "延期天数必须大于0", color: "error" });
      return;
    }
    const baseDate = options.selectedDelayReturnTime.value ?? new Date();
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + options.delayDay.value);
    try {
      options.submittingDelay.value = true;
      await borrowApi.update(options.selectedDelayBorrowId.value, { returnTime: nextDate });
      toast.add({ title: "成功", description: "延期成功", color: "success" });
      options.openConfirm.value = false;
      await options.fetchData();
    } catch {
      toast.add({ title: "错误", description: "延期失败", color: "error" });
    } finally {
      options.submittingDelay.value = false;
    }
  }

  async function sendReminder(borrowId: string) {
    try {
      await borrowApi.remind(borrowId);
      toast.add({ title: "成功", description: "提醒已发送", color: "success" });
    } catch {
      toast.add({ title: "错误", description: "发送提醒失败", color: "error" });
    }
  }

  async function confirmReturnBorrow(borrowId: string) {
    try {
      await ElMessageBox.confirm("还书后不可撤销", "确认还书吗？");
    } catch {
      return;
    }
    try {
      options.returningBorrowId.value = borrowId;
      await borrowApi.update(borrowId, { realityReturnTime: new Date() });
      toast.add({ title: "成功", description: "还书成功", color: "success" });
      await options.fetchData();
    } catch {
      toast.add({ title: "错误", description: "还书失败", color: "error" });
    } finally {
      options.returningBorrowId.value = "";
    }
  }

  return { submitForm, submitDelayDay, sendReminder, confirmReturnBorrow };
}
