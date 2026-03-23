import {watch} from "vue";
import type {Ref} from "vue";
import {CalendarDate} from "@internationalized/date";
import bookApi, {type BookForm} from "@/api/library/book-api";
import FileApi from "@/api/file-api";
import type {CategoryLazyOption} from "@/api/library/category-api";

interface CoverFileLike {
  file?: File
  raw?: File
}

export type CoverFileModel = File | CoverFileLike | Array<File | CoverFileLike>

interface UseStockEditOptions {
  openEditBookDialog: Ref<boolean>
  openEntryStepper: Ref<boolean>
  loadingOptions: Ref<boolean>
  loadingEditBook: Ref<boolean>
  submittingEditBook: Ref<boolean>
  editingIsbn: Ref<string>
  editBookState: Ref<BookForm>
  editBookCoverModel: Ref<File | undefined> | Ref<CoverFileModel | undefined>
  editBookPublishTime: Ref<CalendarDate>
  categoryTreeCacheData: Ref<CategoryLazyOption[]>
  initialEditBookFormData: BookForm
  fetchEntryOptions: () => Promise<void>
  ensureCategoryNodeCache: (categoryId: unknown) => Promise<void>
  fetchData: () => Promise<void>
}

function toCalendarDate(value?: Date | string) {
  const target = value ? new Date(value) : new Date()
  return new CalendarDate(target.getFullYear(), target.getMonth() + 1, target.getDate())
}

function getCoverFileFromModel(model?: CoverFileModel): File | undefined {
  if (!model) return void 0
  if (model instanceof File) return model
  if (Array.isArray(model)) {
    if (model.length === 0) return void 0
    const first = model[0]
    if (!first) return void 0
    if (first instanceof File) return first
    if (first.file instanceof File) return first.file
    if (first.raw instanceof File) return first.raw
    return void 0
  }
  if (model.file instanceof File) return model.file
  if (model.raw instanceof File) return model.raw
  return void 0
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
      const file = getCoverFileFromModel(options.editBookCoverModel.value)
      if (file) {
        const {url} = await FileApi.uploadFile(file)
        payload.cover = url
      }
      await bookApi.update(payload)
      toast.add({title: "成功", description: "修改成功", color: "success"})
      options.openEditBookDialog.value = false
      await options.fetchData()
    } catch (error) {
      toast.add({
        title: "错误",
        description: error instanceof Error ? error.message : "修改图书失败",
        color: "error"
      })
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
