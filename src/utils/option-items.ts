import { StatusTypeEnum, UserGenderTypeEnum } from "@/enums/system/status-enum"

export function createStatusOptions(withAll = false) {
  const base = [
    { label: "启用", value: StatusTypeEnum.ACCESS as number },
    { label: "禁用", value: StatusTypeEnum.BAN as number },
  ]
  if (withAll) {
    return [{ label: "全部状态", value: -1 }, ...base]
  }
  return base
}

export function createGenderOptions() {
  return [
    { label: "保密", value: UserGenderTypeEnum.UNKNOWN as number },
    { label: "男", value: UserGenderTypeEnum.MAN as number },
    { label: "女", value: UserGenderTypeEnum.WOMAN as number },
  ]
}
