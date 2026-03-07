import {watch} from "vue";
import type {Ref} from "vue";
import {CalendarDate} from "@internationalized/date";
import bookApi, {type BookForm} from "@/api/library/book-api.ts";
import FileApi from "@/api/file-api.ts";
import type {CategoryLazyOption} from "@/api/library/category-api.ts";

interface UseStockEditOptions {
  openEditBookDialog: Ref<boolean>
  openEntryStepper: Ref<boolean>
  loadingOptions: Ref<boolean>
  loadingEditBook: Ref<boolean>
  submittingEditBook: Ref<boolean>
  editingIsbn: Ref<string>
  editBookState: Ref<BookForm>
  editBookCoverModel: Ref<File | undefined>
  editBookPublishTime: Ref<CalendarDate>
  categoryTreeCacheData: Ref<CategoryLazyOption[]>
  initialEditBookFormData: BookForm
  fetchEntryOptions: () => Promise<void>
  ensureCategoryNodeCache: (categoryId: unknown) => Promise<void>
  fetchData: () => Promise<void>
  getCoverFile: () => File | undefined
}

function toCalendarDate(value?: Date | string) {
  const target = value ? new Date(value) : new Date()
  return new CalendarDate(target.getFullYear(), target.getMonth() + 1, target.getDate())
}

export function useStockEdit(options: UseStockEditOptions) {
  const toast = useToast()

  function resetEditBookForm() {
    options.editBookState.value = {...options.initialEditBookFormData}
    options.editBookCoverModel.value = void 0
    options.editBookPublishTime.value = toCalendarDate()
    options.categoryTreeCacheData.value = []
    options.submittingEditBook.value = false
    options.editingIsbn.value = ""
  }

  watch(options.openEditBookDialog, (isOpen) => {
    if (!isOpen) {
      resetEditBookForm()
    }
  })

  async function openEntryModal() {
    options.loadingOptions.value = true
    try {
      await options.fetchEntryOptions()
      options.openEntryStepper.value = true
    } catch {
      toast.add({title: "错误", description: "加载书籍选项失败", color: "error"})
    } finally {
      options.loadingOptions.value = false
    }
  }

  async function openEditBookModal(isbn: string) {
    if (!isbn) return
    options.editingIsbn.value = isbn
    options.loadingEditBook.value = true
    try {
      const [formData] = await Promise.all([
        bookApi.getFormData(isbn),
        options.fetchEntryOptions(),
      ])
      options.editBookState.value = {...formData}
      options.editBookPublishTime.value = toCalendarDate(formData.publishTime)
      await options.ensureCategoryNodeCache(formData.categoryId)
      options.editBookCoverModel.value = void 0
      options.openEditBookDialog.value = true
    } catch {
      toast.add({title: "错误", description: "加载图书信息失败", color: "error"})
    } finally {
      options.loadingEditBook.value = false
    }
  }

  async function submitEditBook() {
    if (!options.editingIsbn.value) {
      toast.add({title: "错误", description: "ISBN不能为空", color: "error"})
      return
    }

    const payload: BookForm = {
      ...options.editBookState.value,
      isbn: options.editingIsbn.value,
      publishTime: new Date(options.editBookPublishTime.value.toString())
    }

    try {
      options.submittingEditBook.value = true
      const file = options.getCoverFile()
      if (file) {
        const {url} = await FileApi.uploadFile(file)
        payload.cover = url
      }
      await bookApi.update(payload)
      toast.add({title: "成功", description: "修改成功", color: "success"})
      options.openEditBookDialog.value = false
      await options.fetchData()
    } catch {
      toast.add({title: "错误", description: "修改图书失败", color: "error"})
    } finally {
      options.submittingEditBook.value = false
    }
  }

  return {
    resetEditBookForm,
    openEntryModal,
    openEditBookModal,
    submitEditBook,
  }
}
