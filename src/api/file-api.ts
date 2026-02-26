import request from "@/utils/request";

const FILE_BASE_URL = "/api/v1/files";
const FILE_UPLOADS_BASE_URL = "/uploads";

const FileApi = {
    resolveUrl(url?: string | null) {
        const rawUrl = String(url ?? "").trim();
        if (!rawUrl) return "";

        // OSS / CDN / base64 / blob URLs should keep original value.
        if (
            rawUrl.startsWith("http://")
            || rawUrl.startsWith("https://")
            || rawUrl.startsWith("//")
            || rawUrl.startsWith("data:")
            || rawUrl.startsWith("blob:")
        ) {
            return rawUrl;
        }

        if (rawUrl === FILE_UPLOADS_BASE_URL || rawUrl.startsWith(`${FILE_UPLOADS_BASE_URL}/`)) {
            return rawUrl;
        }

        if (rawUrl.startsWith("/")) {
            return `${FILE_UPLOADS_BASE_URL}${rawUrl}`;
        }

        return rawUrl;
    },
    /** 上传文件 （传入 FormData，上传进度回调） */
    upload(formData: FormData, onProgress?: (percent: number) => void) {
        return request<any, FileInfo>({
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
        const formData = new FormData();
        formData.append("file", file);
        return request<any, FileInfo>({
            url: FILE_BASE_URL,
            method: "post",
            data: formData,
            headers: {"Content-Type": "multipart/form-data"},
        });
    },

    /** 删除文件 */
    delete(filePath?: string) {
        return request({
            url: FILE_BASE_URL,
            method: "delete",
            params: {filePath},
        });
    },

    /** 下载文件 */
    download(url: string, fileName?: string) {
        const downloadUrl = FileApi.resolveUrl(url);
        return request({
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
