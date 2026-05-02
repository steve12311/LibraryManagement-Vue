export const SAFE_IMAGE_FILE_PATTERN = /\.(jpg|jpeg|png|gif)$/i
export const SAFE_IMAGE_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif"])
export const MAX_SAFE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const SAFE_IMAGE_UPLOAD_ACCEPT = ".jpg,.jpeg,.png,.gif,image/jpeg,image/png,image/gif"
export const SAFE_IMAGE_UPLOAD_DESCRIPTION = "支持 JPG、JPEG、PNG、GIF，单文件最大 5MB"
