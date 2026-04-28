<script setup lang="ts">
import {onMounted, ref, useTemplateRef} from "vue";

interface SelectTreeItem {
  label?: string
  value: OptionType["value"]
}

const props = defineProps<{
  items: OptionType[];
  disabled?: boolean
}>()
const inputValue = defineModel<OptionType["value"] | undefined>("selectValue")

onMounted(() => {
  treeWidth.value = inputEl.value?.inputRef?.getBoundingClientRect().width || 0
  inputLabel.value = findOptionByValue(props.items, inputValue.value)?.label || ""
})

const inputLabel = ref("")
const inputEl = useTemplateRef("input")
const treeWidth = ref(0)

function onSelect(_: unknown, item: SelectTreeItem) {
  inputLabel.value = item.label || ""
  inputValue.value = item.value
}

function findOptionByValue(
    options: OptionType[],
    value: OptionType["value"] | undefined
): OptionType | undefined {
  for (const option of options) {
    if (option.value === value) {
      return option;
    }

    if (option.children && option.children.length > 0) {
      const foundInChildren = findOptionByValue(option.children, value);
      if (foundInChildren) {
        return foundInChildren;
      }
    }
  }

  return undefined;
}
</script>

<template>
  <div class="w-full">
    <UPopover>
      <UButton class="p-0 m-0 w-full" variant="outline" :disabled="disabled">
        <UInput ref="input" class="w-full" :disabled="disabled" v-model="inputLabel"/>
      </UButton>
      <template #content>
        <UTree :style="{width: treeWidth + 'px'}" @select="onSelect" :items="items"
               class="p-2"
               :ui="{
                 linkLeadingIcon:'hidden',
               }"
        />
      </template>
    </UPopover>
  </div>
</template>

<style scoped>

</style>
