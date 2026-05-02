<script setup lang="ts">
import { resolveComponent } from "vue"
import type { BorrowForm } from "@/api/library/borrow-api"
import type { CalendarDate } from "@internationalized/date"
import type { InputMenuItem, SelectMenuItem } from "@nuxt/ui"

defineProps<{
  open: boolean
  loading: boolean
  submitting: boolean
  state: BorrowForm
  returnTime: CalendarDate
  userOptions: SelectMenuItem[]
  bookOptions: InputMenuItem[]
}>()

const emit = defineEmits<{
  "update:open": [value: boolean]
  "update:state": [value: BorrowForm]
  "update:returnTime": [value: CalendarDate]
  submit: []
}>()

const UInputMenu = resolveComponent("UInputMenu")
const USelectMenu = resolveComponent("USelectMenu")
const UInputDate = resolveComponent("UInputDate")
const UCalendar = resolveComponent("UCalendar")
const UButton = resolveComponent("UButton")
const UPopover = resolveComponent("UPopover")
</script>

<template>
  <UModal
      :open="open"
      title="新增借阅"
      :ui="{ content: 'sm:max-w-2xl rounded-2xl border border-default bg-default shadow' }"
      @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">创建借阅单</p>
        <p class="system-modal-description">选择图书、用户与归还日期</p>
      </div>
      <UForm @submit.prevent="emit('submit')" class="mt-5 gap-y-4">
        <UFormField name="isbn" class="w-full" label="ISBN" required>
          <UInputMenu valueKey="value" :model-value="state.isbn" virtualize icon="i-lucide-book" class="w-full"
                      :items="bookOptions" :loading="loading" :ui="{ content: 'min-w-fit' }" required
                      @update:model-value="(v: unknown) => emit('update:state', { ...state, isbn: v as string })"/>
        </UFormField>
        <UFieldGroup class="w-full gap-2">
          <UFormField name="userId" class="w-full" label="借阅用户" required>
            <USelectMenu valueKey="value" :model-value="state.userId" virtualize icon="i-lucide-user" class="w-full"
                         :items="userOptions" :loading="loading" :ui="{ content: 'min-w-fit' }" required
                         @update:model-value="(v: unknown) => emit('update:state', { ...state, userId: v as string })"/>
          </UFormField>
          <UFormField class="w-full" label="归还日期">
            <UInputDate class="w-full" :model-value="returnTime" @update:model-value="(v: unknown) => emit('update:returnTime', v as CalendarDate)">
              <template #trailing>
                <UPopover>
                  <UButton color="neutral" variant="link" size="sm" icon="i-lucide-calendar" aria-label="Select a date" class="px-0"/>
                  <template #content>
                    <UCalendar :model-value="returnTime" class="p-2" @update:model-value="(v: unknown) => emit('update:returnTime', v as CalendarDate)"/>
                  </template>
                </UPopover>
              </template>
            </UInputDate>
          </UFormField>
        </UFieldGroup>
      </UForm>
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton @click="emit('update:open', false)" variant="ghost" label="取消"/>
        <UButton @click="emit('submit')" :loading="submitting" variant="subtle" color="error" label="确定"/>
      </div>
    </template>
  </UModal>
</template>
