import request from "@/utils/request";

const FILE_BASE_URL = "/api/v1/files";

const FileApi = {
    getFile(url: string) {
        return request({
            url: FILE_BASE_URL + "/uploads" + url,
            method: "get",
            responseType: "blob"
        })
    },
    uploadFile(file: File) {
        if (!(file instanceof File)) {
            return Promise.reject(new Error("文件不能为空"));
        }

        const formData = new FormData();
        formData.append("file", file, file.name);
        return request<any, UploadFileResponse>({
            url: FILE_BASE_URL,
            method: "post",
            data: formData
        })
    }
}

export interface UploadFileResponse {
    name: string;
    url: string;
}

export default FileApi;
