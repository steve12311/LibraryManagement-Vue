import { type Ref } from "vue"
import type { PublishForm, PublishId } from "@/api/library/publish-api"
import publishApi from "@/api/library/publish-api"
import * as v from "valibot"

const initialPublishFormData: PublishForm = {
  id: undefined, name: "", country: "", province: "", city: "",
  area: "", areaDetail: "", postalCode: "", telephone: "", email: "",
}

const schema = v.object({ name: v.pipe(v.string(), v.nonEmpty("名称不可为空")) })

export function usePublishForm(options: {
  loadingEditPublish: Ref<boolean>
}) {
  const toast = useToast()

  function createPublishForm(overrides: Partial<PublishForm> = {}): PublishForm {
    return {
      ...initialPublishFormData,
      ...overrides,
      id: overrides.id === undefined || overrides.id === null ? undefined : Number(overrides.id),
      name: String(overrides.name ?? initialPublishFormData.name),
      country: String(overrides.country ?? initialPublishFormData.country),
      province: String(overrides.province ?? initialPublishFormData.province),
      city: String(overrides.city ?? initialPublishFormData.city),
      area: String(overrides.area ?? initialPublishFormData.area),
      areaDetail: String(overrides.areaDetail ?? initialPublishFormData.areaDetail),
      postalCode: String(overrides.postalCode ?? initialPublishFormData.postalCode),
      telephone: String(overrides.telephone ?? initialPublishFormData.telephone),
      email: String(overrides.email ?? initialPublishFormData.email),
    }
  }

  function normalizeText(value?: string) {
    return String(value ?? "").trim()
  }

  function normalizePublishPayload(raw: PublishForm, overrideId?: PublishId): PublishForm {
    const toOptional = (v?: string) => { const t = normalizeText(v); return t || undefined }
    return {
      id: overrideId === undefined ? undefined : Number(overrideId),
      name: normalizeText(raw.name),
      country: toOptional(raw.country),
      province: toOptional(raw.province),
      city: toOptional(raw.city),
      area: toOptional(raw.area),
      areaDetail: toOptional(raw.areaDetail),
      postalCode: toOptional(raw.postalCode),
      telephone: toOptional(raw.telephone),
      email: toOptional(raw.email),
    }
  }

  async function loadPublishForm(id: PublishId | undefined) {
    if (id === undefined || id === null) return
    options.loadingEditPublish.value = true
    try {
      const data = await publishApi.getFormData(id)
      return createPublishForm(data ?? {})
    } catch {
      toast.add({ title: "错误", description: "数据加载失败", color: "error" })
      return undefined
    } finally {
      options.loadingEditPublish.value = false
    }
  }

  return { initialPublishFormData, schema, createPublishForm, normalizePublishPayload, loadPublishForm }
}
