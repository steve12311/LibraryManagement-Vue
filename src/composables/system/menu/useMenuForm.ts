import type {Ref} from "vue";
import type {MenuForm, MenuId} from "@/api/system/menu-api";
import {MenuTypeEnum} from "@/enums/system/menu-enum";

export const defaultMenuFormData: MenuForm = {
  id: undefined,
  parentId: 0,
  visible: 1,
  sort: 1,
  type: MenuTypeEnum.MENU,
  alwaysShow: 0,
  keepAlive: 1,
  perms: [],
  params: [],
}

export function createMenuForm(overrides: Partial<MenuForm> = {}): MenuForm {
  return {
    ...defaultMenuFormData,
    ...overrides,
    perms: [...(overrides.perms ?? defaultMenuFormData.perms ?? [])],
    params: [...(overrides.params ?? defaultMenuFormData.params ?? [])],
  }
}

export function getIconInputValue(icon?: string) {
  return (icon || "").replace("i-lucide-", "")
}

function normalizeIconInputValue(value: string | number) {
  const icon = String(value ?? "").trim()
  return icon ? `i-lucide-${icon}` : ""
}

export function getCatalogRoutePathValue(routePath?: string) {
  return (routePath || "").replace(/^\//, "")
}

function normalizeCatalogRoutePathValue(value: string | number) {
  return String(value ?? "").trim().replace(/^\/+/, "")
}

export function normalizeMenuFormFromApi(data: MenuForm, parentId?: MenuId) {
  const normalized = createMenuForm({
    ...data,
    parentId: data.parentId ?? parentId ?? 0,
    perms: (data.perms ?? []).map((item) => ({...item})),
    params: (data.params ?? []).map((item) => ({...item})),
  })

  if (normalized.id !== undefined && normalized.perms?.length) {
    normalized.perms = normalized.perms.map((item) => ({
      ...item,
      parentId: item.parentId ?? normalized.id,
    }))
  }

  return normalized
}

function buildNormalizedMenuPayload(formData: MenuForm): MenuForm {
  const payload = createMenuForm({
    ...formData,
    name: formData.name?.trim(),
    routeName: formData.routeName?.trim(),
    routePath: formData.routePath?.trim().replace(/^\/+/, ""),
    component: formData.component?.trim(),
    redirect: formData.redirect?.trim(),
    perm: formData.perm?.trim(),
    parentId: Number(formData.parentId ?? 0),
    sort: Number(formData.sort ?? 1),
  })

  payload.visible = Number(payload.visible ?? 1) as MenuForm["visible"]
  payload.alwaysShow = Number(payload.alwaysShow ?? 0) as MenuForm["alwaysShow"]
  payload.keepAlive = Number(payload.keepAlive ?? 1) as MenuForm["keepAlive"]
  payload.perms = (payload.perms ?? []).map((item) => ({
    ...item,
    parentId: payload.id ?? payload.parentId ?? 0,
    label: item.label?.trim(),
    value: item.value?.trim(),
  }))

  return payload
}

export function useMenuForm(formData: Ref<MenuForm>) {
  function setIconInputValue(value: string | number) {
    formData.value.icon = normalizeIconInputValue(value)
  }

  function setCatalogRoutePathValue(value: string | number) {
    formData.value.routePath = normalizeCatalogRoutePathValue(value)
  }

  function normalizeMenuPayload() {
    return buildNormalizedMenuPayload(formData.value)
  }

  return {
    defaultMenuFormData,
    createMenuForm,
    getIconInputValue,
    setIconInputValue,
    getCatalogRoutePathValue,
    setCatalogRoutePathValue,
    normalizeMenuFormFromApi,
    normalizeMenuPayload,
  }
}
