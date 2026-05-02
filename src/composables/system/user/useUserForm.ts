import {ref} from "vue";
import type {Ref} from "vue";
import type {SelectMenuItem} from "@nuxt/ui";
import RoleAPI from "@/api/system/role-api";
import type {UserForm} from "@/api/system/user-api";
import {UserGenderTypeEnum, StatusTypeEnum} from "@/enums/system/status-enum";
import type { ModalEditMode } from "@/types/common";

interface UseUserFormOptions {
  avatarModel: Ref<File | undefined>
  submittingEditUser: Ref<boolean>
  loadingEditUser: Ref<boolean>
  editingUserId: Ref<string>
  editModalMode: Ref<ModalEditMode>
  editModalTitle: Ref<string>
  assignRoleUserId: Ref<string>
  assignRoleUsername: Ref<string>
  submittingAssignRole: Ref<boolean>
  loadingAssignRole: Ref<boolean>
  assigningRoleUserId: Ref<string>
}

/** 用户表单状态管理：角色选项、编辑/分配表单重置 */
export function useUserForm(options: UseUserFormOptions) {
  const toast = useToast()
  const initialUserFormData: UserForm = {
    id: 0,
    username: "",
    nickname: "",
    mobile: "",
    gender: UserGenderTypeEnum.UNKNOWN,
    avatar: "",
    email: "",
    status: StatusTypeEnum.ACCESS,
    deptId: 0,
    roleIds: [],
    openId: ""
  }
  const editUserState = ref<UserForm>({...initialUserFormData})
  const assignRoleState = ref<UserForm>({...initialUserFormData})
  const roleOptions = ref<SelectMenuItem[]>([])
  const loadingRoleOptions = ref(false)

  async function fetchRoleOptions() {
    loadingRoleOptions.value = true
    try {
      roleOptions.value = await RoleAPI.getOptions()
    } catch {
      toast.add({title: "错误", description: "角色选项加载失败", color: "error"})
    } finally {
      loadingRoleOptions.value = false
    }
  }

  function resetEditUserForm() {
    editUserState.value = {...initialUserFormData}
    options.avatarModel.value = void 0
    options.submittingEditUser.value = false
    options.loadingEditUser.value = false
    options.editingUserId.value = ""
    options.editModalMode.value = "add"
    options.editModalTitle.value = "新增用户"
  }

  function resetAssignRoleForm() {
    assignRoleState.value = {...initialUserFormData}
    options.assignRoleUserId.value = ""
    options.assignRoleUsername.value = ""
    options.submittingAssignRole.value = false
    options.loadingAssignRole.value = false
    options.assigningRoleUserId.value = ""
  }

  return {
    initialUserFormData,
    editUserState,
    assignRoleState,
    roleOptions,
    loadingRoleOptions,
    fetchRoleOptions,
    resetEditUserForm,
    resetAssignRoleForm,
  }
}
