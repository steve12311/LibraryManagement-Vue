import { ref, shallowRef } from "vue"
import type { InputMenuItem, SelectMenuItem } from "@nuxt/ui"
import { CalendarDate } from "@internationalized/date"
import type { BorrowForm } from "@/api/library/borrow-api"
import userApi from "@/api/system/user-api"
import bookApi from "@/api/library/book-api"
import * as v from "valibot"

const initialBorrowFormData: BorrowForm = {
  isbn: "",
  userId: "",
  returnTime: new Date(),
}

export function useBorrowForm() {
  const date = new Date()
  const state = ref<BorrowForm>({ ...initialBorrowFormData })
  const returnTime = shallowRef(new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()))
  const userOptions = ref<SelectMenuItem[]>([])
  const bookOptions = ref<InputMenuItem[]>([])
  const loadingBorrowOptions = ref(false)

  const schema = v.object({
    isbn: v.union([
      v.pipe(v.string(), v.nonEmpty("ISBN不能为空")),
      v.number("ISBN不能为空"),
    ]),
    userId: v.union([
      v.pipe(v.string(), v.nonEmpty("借阅用户不能为空")),
      v.number("借阅用户不能为空"),
    ]),
  })

  function toCalendarDate(value?: Date | string | null) {
    const target = value ? new Date(value) : new Date()
    return new CalendarDate(target.getFullYear(), target.getMonth() + 1, target.getDate())
  }

  function parseDate(value?: Date | string | null) {
    if (!value) return null
    const target = new Date(value)
    if (Number.isNaN(target.getTime())) return null
    return target
  }

  function resetBorrowForm() {
    state.value = { ...initialBorrowFormData }
    returnTime.value = toCalendarDate()
  }

  async function fetchUserOptions() {
    userOptions.value = await userApi.getOptions()
  }

  async function fetchBookOptions() {
    bookOptions.value = await bookApi.getOptions()
  }

  return {
    state,
    returnTime,
    schema,
    userOptions,
    bookOptions,
    loadingBorrowOptions,
    toCalendarDate,
    parseDate,
    resetBorrowForm,
    fetchUserOptions,
    fetchBookOptions,
  }
}
