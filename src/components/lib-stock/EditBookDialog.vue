<script setup lang="ts">
import {useTemplateRef} from 'vue'
import type {SelectMenuItem} from '@nuxt/ui'
import {CalendarDate} from '@internationalized/date'
import {ElDialog, ElTreeSelect} from 'element-plus'
import type {BookForm} from '@/api/book-api.ts'

const open = defineModel<boolean>('open', {default: false})
const state = defineModel<BookForm>('state', {required: true})
const coverModel = defineModel<File | undefined>('coverModel')
const publishTime = defineModel<CalendarDate>('publishTime', {required: true})

withDefaults(defineProps<{
  publishOptions: SelectMenuItem[]
  categoryTreeOptions: OptionType[]
  submitting?: boolean
}>(), {
  submitting: false
})

const emit = defineEmits<{
  submit: []
}>()

const editBookInputDate = useTemplateRef('editBookInputDate')
</script>

<template>
  <ElDialog v-model="open" title="修改图书信息" align-center>
    <div class="w-full" style="max-height: 70vh;overflow-y: scroll;overflow-x: hidden">
      <UForm :state="state" class="flex flex-col gap-y-4">
        <UFormField class="w-full" label="出版日期">
          <UInputDate class="w-full" ref="editBookInputDate" v-model="publishTime">
            <template #trailing>
              <UPopover :reference="editBookInputDate?.inputsRef[3]?.$el">
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
            <USelect valueKey="value" v-model="state.pressId" class="w-full" :items="publishOptions"/>
          </UFormField>
          <UFormField class="w-full" label="分类">
            <ElTreeSelect
                v-model="state.categoryId"
                :data="categoryTreeOptions"
                :check-strictly="true"
                :render-after-expand="false"
                placeholder="选择分类"
                class="w-full"
            />
          </UFormField>
        </UFieldGroup>
        <UFormField class="w-full" label="价格">
          <UInputNumber v-model="state.price" :formatOptions="{
            style: 'currency',
            currency: 'CNY',
            currencyDisplay: 'code',
            currencySign: 'accounting'
          }" :min="0" :step="0.01" class="w-full"/>
        </UFormField>
        <UFormField class="w-full" label="简介">
          <UTextarea v-model="state.intro" class="w-full" :rows="12"/>
        </UFormField>
      </UForm>
    </div>
    <template #footer>
      <div class="w-full flex justify-end gap-2 mt-4">
        <UButton label="取消" variant="ghost" @click="open = false"/>
        <UButton label="保存" :loading="submitting" @click="emit('submit')"/>
      </div>
    </template>
  </ElDialog>
</template>
