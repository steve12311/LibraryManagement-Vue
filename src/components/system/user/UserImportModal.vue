<script setup lang="ts">
defineProps<{
  open: boolean
  fileModel: File | null
  downloadingTemplate: boolean
  importing: boolean
  accept: string
  description: string
}>()

const emit = defineEmits<{
  "update:open": [boolean]
  "update:fileModel": [File | null]
  "download-template": []
  submit: []
}>()

function updateFileModel(value: File | File[] | null | undefined) {
  if (value instanceof File) {
    emit("update:fileModel", value)
    return
  }

  if (Array.isArray(value)) {
    emit("update:fileModel", value[0] instanceof File ? value[0] : null)
    return
  }

  emit("update:fileModel", null)
}
</script>

<template>
  <UModal
      :open="open"
      title="导入用户"
      :ui="{ content: 'sm:max-w-2xl rounded-[28px] border border-default bg-default shadow-lg' }"
      @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="system-modal-copy">
        <p class="system-modal-title">批量导入</p>
        <p class="system-modal-description">请先下载最新模板，按角色名称填写后再上传 Excel 文件。</p>
      </div>

      <div class="mt-5 space-y-4">
        <div class="flex items-center justify-between gap-3 rounded-2xl border border-default bg-muted/30 px-4 py-3">
          <div>
            <p class="text-sm font-medium text-highlighted">模板说明</p>
            <p class="mt-1 text-sm text-muted">角色列填写角色名称，多角色使用英文逗号分隔。</p>
          </div>
          <UButton
              label="下载模板"
              icon="i-lucide-file-down"
              variant="subtle"
              :loading="downloadingTemplate"
              @click="emit('download-template')"
          />
        </div>

        <UFileUpload
            :model-value="fileModel"
            :accept="accept"
            label="上传用户导入文件"
            :description="description"
            class="w-full min-h-32"
            @update:model-value="updateFileModel"
        />

        <ul class="space-y-1 text-sm text-muted">
          <li>1. 模板中的角色字段使用角色名称，不填写角色 ID。</li>
          <li>2. 导入采用部分成功模型，失败明细会在导入结果中展示。</li>
          <li>3. 导出会复用当前列表页已生效的筛选条件。</li>
        </ul>
      </div>
    </template>
    <template #footer>
      <div class="system-modal-footer">
        <UButton label="取消" variant="ghost" @click="emit('update:open', false)"/>
        <UButton label="开始导入" icon="i-lucide-upload" :loading="importing" @click="emit('submit')"/>
      </div>
    </template>
  </UModal>
</template>
