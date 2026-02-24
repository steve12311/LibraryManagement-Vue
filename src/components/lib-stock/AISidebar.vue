<script setup lang="ts">
import {ref} from 'vue'
import {type UIMessage} from 'ai'
import {getTextFromMessage} from '@nuxt/ui/utils/ai'
import Markdown from 'markstream-vue'
import {AIChat} from '@/utils/Chat.ts'

const open = defineModel<boolean>('open', {default: false})

const copied = ref(false)
const inputMessage = ref('')
const chat = new AIChat({})

function sendMessage(e: Event) {
  e.preventDefault()
  if (inputMessage.value.trim() === '') {
    return
  }
  chat.sendMessage(inputMessage.value)
  inputMessage.value = ''
}

async function copy(_: MouseEvent, message: UIMessage) {
  await navigator.clipboard.writeText(getTextFromMessage(message))
  copied.value = true
  setTimeout(() => {
    copied.value = false
  }, 2000)
}
</script>

<template>
  <USlideover title="智慧咨询" v-model:open="open">
    <template #body>
      <UContainer class="flex flex-col gap-4 sm:gap-6" style="min-height: 100%;padding: 0">
        <UPageCard class="flex-1" spotlight
                   spotlight-color="primary"
                   v-if="chat.messages.value && chat.messages.value.length === 0"
                   title="欢迎使用智慧书籍查询"
        />
        <UChatMessages
            v-else
            :should-auto-scroll="true"
            :status="chat.status.value"
            :user="{
        variant: 'solid',
      }"
            :assistant="{
        side:'left',
        variant:'outline',
        avatar:{
          icon:'i-lucide-bot'
        },
        actions: [
        {
          label: 'Copy to clipboard',
          icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy',
          onClick: copy
        }
      ]}"
            :messages="chat.messages.value"
        >
          <template #content="{ message }">
            <Markdown
                v-if="message.role === 'assistant'"
                :content="message.parts?.filter(p => p.type === 'text').map(p => p.text).join('') || ''"
                class="*:first:mt-0 *:last:mb-0"
            />
            <div
                v-else-if="message.role === 'user'"
                class="whitespace-pre-wrap wrap-break-word"
                v-text="message.parts?.filter(p => p.type === 'text').map(p => p.text).join('') || ''"
            />
          </template>

          <template #indicator>
            <UButton
                class="px-0"
                color="neutral"
                variant="link"
                loading
                loading-icon="i-lucide-loader"
                label="思考中..."
            />
          </template>
        </UChatMessages>
        <UChatPrompt v-model="inputMessage" variant="subtle"
                     class="sticky bottom-0 [view-transition-name:chat-prompt] z-10"
                     @submit="sendMessage">
          <template #footer>
            <div></div>
            <UChatPromptSubmit @reload="chat.reload()" @stop="chat.stop()" :status="chat.status.value" color="neutral"
                               size="sm"/>
          </template>
        </UChatPrompt>
      </UContainer>
    </template>
  </USlideover>
</template>
