<script setup lang="ts">
import {computed, ref} from 'vue'
import {type UIMessage} from 'ai'
import {getTextFromMessage} from '@nuxt/ui/utils/ai'
import Markdown from 'markstream-vue'
import {AIChat} from '@/utils/Chat.ts'

const open = defineModel<boolean>('open', {default: false})
const MAX_INPUT_LENGTH = 1000

const toast = useToast()
const copied = ref(false)
const inputMessage = ref('')
const chat = new AIChat({})
const quickPrompts = [
  '推荐三本适合大学生提升表达能力的书',
  '我想系统学习前端开发，应该从哪几本书开始',
  '给我一个 30 天阅读计划，主题是时间管理',
  '最近借阅量高的经典文学有哪些'
]
const hasMessages = computed(() => chat.messages.value.length > 0)

function sendMessage(e: Event) {
  e.preventDefault()
  submitMessage(inputMessage.value)
}

function submitMessage(message: string) {
  const normalized = message.trim()
  if (normalized === '') {
    return
  }
  if (normalized.length > MAX_INPUT_LENGTH) {
    toast.add({
      title: "错误",
      description: `输入内容不能超过 ${MAX_INPUT_LENGTH} 个字符`,
      color: "error"
    })
    return
  }
  if (chat.status.value === 'submitted' || chat.status.value === 'streaming') {
    return
  }
  chat.sendMessage(normalized)
  inputMessage.value = ''
}

function usePrompt(prompt: string) {
  submitMessage(prompt)
}

async function copy(_: MouseEvent, message: UIMessage) {
  try {
    if (!navigator?.clipboard?.writeText) {
      toast.add({title: "错误", description: "当前浏览器不支持复制功能", color: "error"})
      return
    }
    await navigator.clipboard.writeText(getTextFromMessage(message))
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    toast.add({title: "错误", description: "复制失败，请稍后重试", color: "error"})
  }
}
</script>

<template>
  <USlideover
      v-model:open="open"
      title="智慧咨询"
      description="结合首页检索继续提问，获得阅读建议与借阅辅助"
      :ui="{
      overlay: 'bg-black/35 backdrop-blur-[2px]',
      content: 'sm:max-w-xl border-l border-cyan-200/70 bg-linear-to-b from-cyan-50/90 via-white to-blue-50/95',
      header: 'border-b border-cyan-100 bg-white/70 backdrop-blur px-5 py-4',
      body: 'p-0',
      title: 'text-base font-semibold tracking-wide text-cyan-900',
      description: 'text-xs text-cyan-700/85',
      close: 'text-cyan-700 hover:bg-cyan-100/70'
    }"
  >
    <template #body>
      <div
          v-if="!hasMessages"
          class="ai-welcome rounded-2xl border border-cyan-100/80 bg-white/88 p-5 shadow-sm"
      >
        <p class="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-700">
          <UIcon name="i-lucide-sparkles" class="h-4 w-4"/>
          AI 阅读助手
        </p>
        <h3 class="mt-4 text-lg font-semibold text-cyan-950">欢迎使用智慧咨询</h3>
        <p class="mt-2 text-sm leading-6 text-cyan-800/85">
          你可以直接提问图书推荐、学习路线或阅读计划，助手会结合图书馆场景给出可执行建议。
        </p>
        <div class="mt-4 flex flex-wrap gap-2">
          <UButton
              v-for="item in quickPrompts"
              :key="item"
              size="xs"
              color="neutral"
              variant="soft"
              class="ai-prompt-pill"
              @click="usePrompt(item)"
          >
            {{ item }}
          </UButton>
        </div>
      </div>
      <UChatMessages
          v-else
          :ui="{
            indicator: 'text-cyan-700',
            viewport:'top-[68%]'
          }"
          :should-auto-scroll="true"
          :status="chat.status.value"
          :user="{
        variant: 'soft',
      }"
          :assistant="{
        side:'left',
        variant:'outline',
        avatar:{
          icon:'i-lucide-bot'
        },
        actions: [
        {
          label: '复制',
          icon: copied ? 'i-lucide-copy-check' : 'i-lucide-copy',
          onClick: copy
        }
      ]}"
          :messages="chat.messages.value"
      >
        <template #content="{ message }">
          <Markdown
              v-if="message.role === 'assistant'"
              :content="getTextFromMessage(message)"
              class="*:first:mt-0 *:last:mb-0"
          />
          <div
              v-else-if="message.role === 'user'"
              class="whitespace-pre-wrap break-words"
              v-text="getTextFromMessage(message)"
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
    </template>
    <template #footer>
      <div class="ai-input w-full">
        <div class="mb-2 flex gap-2 overflow-x-auto pb-1">
          <UButton
              v-for="item in quickPrompts.slice(0, 2)"
              :key="item"
              size="xs"
              color="neutral"
              variant="ghost"
              class="shrink-0 border border-cyan-100 bg-white/75 text-cyan-700 hover:bg-cyan-50"
              @click="usePrompt(item)"
          >
            {{ item }}
          </UButton>
        </div>
        <UChatPrompt
            v-model="inputMessage"
            variant="subtle"
            placeholder="输入你的问题，例如：推荐三本数据结构入门书"
            :disabled="chat.status.value === 'streaming'"
            :ui="{
                root: 'rounded-2xl border border-cyan-200/80 bg-white/92 px-3 py-2 shadow-sm backdrop-blur',
                body: 'bg-transparent',
                footer: 'mt-2'
              }"
            class="[view-transition-name:chat-prompt]"
            @submit="sendMessage"
        >
          <template #footer>
            <span class="text-xs text-cyan-700/85">Enter 发送，Shift + Enter 换行</span>
            <UChatPromptSubmit
                @reload="chat.reload()"
                @stop="chat.stop()"
                :status="chat.status.value"
                color="neutral"
                size="sm"
            />
          </template>
        </UChatPrompt>
      </div>
    </template>
  </USlideover>
</template>

<style>
@import "markstream-vue/index.css";
</style>

<style scoped>
.ai-welcome {
  animation: slide-in 300ms ease-out both;
}

.ai-prompt-pill {
  border: 1px solid rgb(186 230 253);
  background: rgb(248 250 252 / 92%);
}

.ai-input {
  border-radius: 1rem;
  background: linear-gradient(180deg, rgb(255 255 255 / 0%) 0%, rgb(239 246 255 / 76%) 45%, rgb(239 246 255 / 96%) 100%);
  padding-top: 0.75rem;
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
