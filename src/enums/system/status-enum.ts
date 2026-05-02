export const SYSTEM_ROOT_ROLE_ID = 1

export const StatusTypeEnum = {
    ACCESS: 1, // 正常
    BAN: 0, // 禁用
} as const

export const UserGenderTypeEnum = {
    UNKNOWN: 0,
    MAN: 1,
    WOMAN: 2,
} as const

export const DataScopeTypeEnum = {
    ALL: 1,
    DEPARTMENT_AND_CHILD: 2,
    DEPARTMENT: 3,
    OWNER: 4,
}