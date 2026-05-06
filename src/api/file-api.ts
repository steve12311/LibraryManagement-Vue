import type { AxiosResponse } from "axios";
import request from "@/utils/request";
import { MAX_SAFE_IMAGE_SIZE_BYTES, SAFE_IMAGE_FILE_PATTERN, SAFE_IMAGE_MIME_TYPES } from "@/constants/file-constants";

export { SAFE_IMAGE_UPLOAD_ACCEPT, SAFE_IMAGE_UPLOAD_DESCRIPTION } from "@/constants/file-constants";

const FILE_BASE_URL = "/api/v1/files";

function normalizeFilePath(url?: string | null) {
    const rawUrl = String(url ?? "").trim();
    if (!rawUrl) return "";

    if (
        rawUrl.startsWith("http://")
        || rawUrl.startsWith("https://")
        || rawUrl.startsWith("//")
        || rawUrl.startsWith("data:")
        || rawUrl.startsWith("blob:")
    ) {
        return rawUrl;
    }

    if (rawUrl.startsWith(FILE_BASE_URL)) {
        return rawUrl;
    }

    if (rawUrl.startsWith(`api/v1/files/`)) {
        return `/${rawUrl}`;
    }

    const normalizedPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    return `${FILE_BASE_URL}${normalizedPath}`;
}

function extractFileId(fileIdOrUrl?: string | number | null) {
    const rawValue = String(fileIdOrUrl ?? "").trim();
    if (!rawValue) {
        return "";
    }

    if (rawValue.startsWith("http://") || rawValue.startsWith("https://")) {
        try {
            const absoluteUrl = new URL(rawValue);
            const pathname = absoluteUrl.pathname;
            if (pathname.startsWith(`${FILE_BASE_URL}/`)) {
                return pathname.slice(FILE_BASE_URL.length + 1);
            }
        } catch {
            return "";
        }
    }

    const normalizedPath = normalizeFilePath(rawValue);
    if (!normalizedPath.startsWith(`${FILE_BASE_URL}/`)) {
        return "";
    }
    return normalizedPath.slice(FILE_BASE_URL.length + 1);
}

function assertSafeImageFile(file: File) {
    if (file.size > MAX_SAFE_IMAGE_SIZE_BYTES) {
        throw new Error("图片大小不能超过 5MB");
    }

    const fileName = file.name.toLowerCase();
    const mimeType = file.type.toLowerCase();
    const isAllowedExtension = SAFE_IMAGE_FILE_PATTERN.test(fileName);
    const isAllowedMimeType = !mimeType || SAFE_IMAGE_MIME_TYPES.has(mimeType);

    if (!isAllowedExtension || !isAllowedMimeType) {
        throw new Error("仅支持上传 JPG、JPEG、PNG、GIF 图片");
    }
}

const FileApi = {
    resolveUrl(url?: string | null) {
        const normalizedPath = normalizeFilePath(url);
        if (!normalizedPath) return "";

        if (
            normalizedPath.startsWith("http://")
            || normalizedPath.startsWith("https://")
            || normalizedPath.startsWith("//")
            || normalizedPath.startsWith("data:")
            || normalizedPath.startsWith("blob:")
        ) {
            return normalizedPath;
        }

        return `${import.meta.env.VITE_APP_API_URL}${normalizedPath}`;
    },
    /** 上传文件 （传入 FormData，上传进度回调） */
    upload(formData: FormData, onProgress?: (percent: number) => void) {
        const file = formData.get("file");
        if (file instanceof File) {
            assertSafeImageFile(file);
        }
        return request<unknown, FileInfo, FormData>({
            url: FILE_BASE_URL,
            method: "post",
            data: formData,
            headers: {"Content-Type": "multipart/form-data"},
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    onProgress?.(percent);
                }
            },
        });
    },

    /** 上传文件（传入 File） */
    uploadFile(file: File) {
        assertSafeImageFile(file);
        const formData = new FormData();
        formData.append("file", file);
        return request<unknown, FileInfo, FormData>({
            url: FILE_BASE_URL,
            method: "post",
            data: formData,
            headers: {"Content-Type": "multipart/form-data"},
        });
    },

    /** 获取文件引用计数 */
    getRefCount(fileIdOrUrl?: string | number | null) {
        const fileId = extractFileId(fileIdOrUrl);
        if (!fileId) {
            return Promise.reject(new Error("文件标识不能为空"));
        }
        return request<unknown, number>({
            url: `${FILE_BASE_URL}/${fileId}/refcount`,
            method: "get",
        });
    },

    /** 物理删除文件（需 sys:file:del 权限） */
    deletePhysical(fileIdOrUrl?: string | number | null) {
        const fileId = extractFileId(fileIdOrUrl);
        if (!fileId) {
            return Promise.reject(new Error("文件标识不能为空"));
        }
        return request<unknown, unknown>({
            url: `${FILE_BASE_URL}/${fileId}`,
            method: "delete",
        });
    },

    /** 下载文件 */
    download(url: string, fileName?: string) {
        const downloadUrl = FileApi.resolveUrl(url);
        return request<unknown, AxiosResponse<Blob>>({
            url: downloadUrl,
            method: "get",
            responseType: "blob",
        }).then((res) => {
            const blob = new Blob([res.data]);
            const a = document.createElement("a");
            const urlObject = window.URL.createObjectURL(blob);
            a.href = urlObject;
            a.download = fileName || "下载文件";
            a.click();
            window.URL.revokeObjectURL(urlObject);
        });
    },
}

export interface FileInfo {
    name: string;
    url: string;
}

export default FileApi;
