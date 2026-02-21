import request from "../utils/request";

const FILE_BASE_URL = "/api/v1/files";

const FileApi = {
    getFile(url: string) {
        return request({
            url: FILE_BASE_URL + "/uploads" + url,
            method: "get",
            responseType: "blob"
        })
    }
}

export default FileApi;