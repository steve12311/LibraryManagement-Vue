<script setup lang="ts">
import {ref, shallowRef, useTemplateRef, watch} from "vue";
import type {SelectMenuItem, StepperItem} from "@nuxt/ui";
import {CalendarDate} from "@internationalized/date";
import stockApi, {type StockForm} from "@/api/stock-api.ts";
import FileApi from "@/api/file-api.ts";
import {ElDialog, ElTreeSelect} from "element-plus";

const open = defineModel<boolean>("open", {default: false})

const props = defineProps<{
  publishOptions: SelectMenuItem[]
  categoryTreeOptions: OptionType[]
}>()

const emit = defineEmits<{
  success: []
}>()

const date = new Date()
const toast = useToast()
const isbnExists = ref(false)
const checkingISBN = ref(false)
const submittingStock = ref(false)
const entryStepper = useTemplateRef("entryStepper")
const entryStepperItems = ref<StepperItem[]>([
  {title: "ISBN"},
  {title: "书籍详情"},
  {title: "检查"}
])

const initialStockFormData: StockForm = {
  author: "",
  categoryId: void 0,
  cover: void 0,
  intro: "",
  isbn: "",
  name: "",
  pressId: void 0,
  price: 0,
  publishTime: date,
  stock: 0
}
const state = ref<StockForm>({...initialStockFormData})
const coverModel = ref<File>()
const inputDate = useTemplateRef("inputDate")
const publishTime = shallowRef(new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate()))

watch(open, (isOpen) => {
  if (isOpen) {
    resetEntryForm()
  }
})

function toCalendarDate(value?: Date | string) {
  const target = value ? new Date(value) : new Date()
  return new CalendarDate(target.getFullYear(), target.getMonth() + 1, target.getDate())
}

function getCoverFileFromModel(model?: File): File | undefined {
  if (!model) return void 0
  const value = model as any
  if (value instanceof File) return value
  if (value?.file instanceof File) return value.file
  if (value?.raw instanceof File) return value.raw
  if (Array.isArray(value) && value.length > 0) {
    const first = value[0]
    if (first instanceof File) return first
    if (first?.file instanceof File) return first.file
    if (first?.raw instanceof File) return first.raw
  }
  return void 0
}

function resetEntryForm() {
  state.value = {...initialStockFormData}
  coverModel.value = void 0
  isbnExists.value = false
  checkingISBN.value = false
  submittingStock.value = false
  publishTime.value = toCalendarDate()
}

async function nextEntryStep() {
  if (!entryStepper.value?.hasNext) return

  if (!entryStepper.value.hasPrev) {
    const isbn = state.value.isbn.trim()
    if (!isbn) {
      toast.add({title: "错误", description: "ISBN不能为空", color: "error"})
      return
    }

    checkingISBN.value = true
    try {
      const formData = await stockApi.getFormData(isbn)
      isbnExists.value = !!formData
      state.value = {
        ...state.value,
        stock: 0
      }
      publishTime.value = toCalendarDate(formData?.publishTime)
      coverModel.value = void 0
      entryStepper.value.next()
    } catch (e) {
      console.log(e)
    } finally {
      checkingISBN.value = false
    }
    return
  }

  entryStepper.value.next()
}

async function submitStock() {
  const isbn = state.value.isbn.trim()
  if (!isbn) {
    toast.add({title: "错误", description: "ISBN不能为空", color: "error"})
    return
  }

  if (state.value.stock <= 0) {
    toast.add({title: "错误", description: "入库数量必须大于0", color: "error"})
    return
  }

  const payload: StockForm = {
    ...state.value,
    isbn,
    publishTime: new Date(publishTime.value.toString())
  }

  try {
    submittingStock.value = true
    if (!isbnExists.value) {
      const file = getCoverFileFromModel(coverModel.value)
      if (file) {
        const {url} = await FileApi.uploadFile(file)
        payload.cover = url
      }
    }
    await stockApi.create(payload)
    toast.add({title: "成功", description: "入库成功", color: "success"})
    open.value = false
    emit("success")
  } catch (e) {
    console.log(e)
  } finally {
    submittingStock.value = false
  }
}
</script>

<template>
  <ElDialog v-model="open" title="图书入库" align-center>
    <div class="w-full" style="max-height: 70vh;overflow-y: scroll;overflow-x: hidden">
      <UStepper disabled ref="entryStepper" :items="entryStepperItems">
        <template #content="{ item }">
          <div class="w-full">
            <UForm :state="state" class="flex flex-col gap-y-4">
              <UFormField class="w-full" label="ISBN" required>
                <UInput v-model="state.isbn" class="w-full" required :disabled="entryStepper?.hasPrev"/>
              </UFormField>
              <template v-if="item.title !== 'ISBN'">
                <template v-if="isbnExists">
                  <UAlert color="warning" variant="soft" title="已存在该 ISBN，只允许录入入库数量"/>
                  <UFormField class="w-full" label="数量">
                    <UInputNumber v-model="state.stock" :min="0" class="w-full"/>
                  </UFormField>
                </template>
                <template v-else>
                  <UFormField class="w-full" label="出版日期">
                    <UInputDate class="w-full" ref="inputDate" v-model="publishTime">
                      <template #trailing>
                        <UPopover :reference="inputDate?.inputsRef[3]?.$el">
                          <UButton
                              color="neutral"
                              variant="link"
                              size="sm"
                              icon="i-lucide-calendar"
                              aria-label="Select a date"
                              class="px-0"
                          />
                          <template #content>
                            <UCalendar v-model="publishTime" class="p-2"/>
                          </template>
                        </UPopover>
                      </template>
                    </UInputDate>
                  </UFormField>
                  <UFormField class="w-full" label="封面">
                    <UFileUpload
                        v-model="coverModel"
                        accept="image/*"
                        label="上传图片拖到此处"
                        description="SVG, PNG, JPG or GIF (最大支持2MB)"
                        class="w-full min-h-48"
                    />
                  </UFormField>
                  <UFieldGroup class="w-full gap-2">
                    <UFormField class="w-full" label="名称">
                      <UInput v-model="state.name" class="w-full"/>
                    </UFormField>
                    <UFormField class="w-full" label="作者">
                      <UInput v-model="state.author" class="w-full"/>
                    </UFormField>
                  </UFieldGroup>
                  <UFieldGroup class="w-full gap-2">
                    <UFormField class="w-full" label="出版社">
                      <USelect v-model="state.pressId" class="w-full" :items="props.publishOptions"/>
                    </UFormField>
                    <UFormField class="w-full" label="数量">
                      <UInputNumber v-model="state.stock" :min="0" class="w-full"/>
                    </UFormField>
                  </UFieldGroup>
                  <UFieldGroup class="w-full gap-2">
                    <UFormField class="w-full" label="价格">
                      <UInputNumber
                          v-model="state.price"
                          :format-options="{
                            style: 'currency',
                            currency: 'CNY',
                            currencyDisplay: 'code',
                            currencySign: 'accounting'
                          }"
                          :min="0"
                          :step="0.01"
                          class="w-full"
                      />
                    </UFormField>
                    <UFormField class="w-full" label="分类">
                      <ElTreeSelect
                          v-model="state.categoryId"
                          :data="props.categoryTreeOptions"
                          :check-strictly="true"
                          :render-after-expand="false"
                          placeholder="选择分类"
                          class="w-full"
                      />
                    </UFormField>
                  </UFieldGroup>
                  <UFormField class="w-full" label="简介">
                    <UTextarea v-model="state.intro" class="w-full" :rows="12"/>
                  </UFormField>
                </template>
              </template>
            </UForm>
          </div>
        </template>
      </UStepper>
    </div>
    <template #footer>
      <div class="w-full flex gap-2 justify-between mt-4">
        <UButton
            leading-icon="i-lucide-arrow-left"
            :disabled="!entryStepper?.hasPrev"
            @click="entryStepper?.prev()"
            label="上一步"
        />
        <template v-if="entryStepper?.hasNext">
          <UButton
              trailing-icon="i-lucide-arrow-right"
              :disabled="!entryStepper?.hasNext || checkingISBN"
              :loading="checkingISBN"
              @click="nextEntryStep"
              label="下一步"
          />
        </template>
        <template v-else>
          <UButton label="完成" :loading="submittingStock" @click="submitStock"/>
        </template>
      </div>
    </template>
  </ElDialog>
</template>
