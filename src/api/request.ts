import axios, {type AxiosResponse} from "axios";
import {useStore} from "@/store/store.ts";

const store = useStore();
const instance = axios.create({
    baseURL: "/system",
    headers: {
        "Content-Type": "application/json",
    }
})

instance.interceptors.request.use(function (config) {
    config.headers.Authorization = `Bearer ${store.token}`
    return config;
})

instance.interceptors.response.use((response: AxiosResponse) => {
    const toast = useToast()
    if (response.status === 401 || response.data.code === 401) {
        toast.add({title: "错误", description: "登录已过期或权限不足", color: "error"})
    }
    return response;
}, (response: AxiosResponse) => {
    const toast = useToast()
    toast.add({title: "错误", description: response.statusText, color: "error"})
    return response;
})

function get<T>(url: string, config?: object): Promise<AxiosResponse<T>> {
    return instance.get(url, config);
}

function post<T>(url: string, data: object, config?: object): Promise<AxiosResponse<T>> {
    return instance.post(url, data, config);
}

export {
    get,
    post,
}