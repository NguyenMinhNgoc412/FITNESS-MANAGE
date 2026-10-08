export function assertLocalStorageReady() {
  if (!globalThis.isSecureContext || !globalThis.crossOriginIsolated || typeof SharedArrayBuffer === 'undefined') {
    throw new Error('Bộ nhớ AI trên web chưa sẵn sàng. Mở trực tiếp trang đăng nhập và đăng nhập lại. Nếu vẫn lỗi, liên hệ chủ phòng tập.');
  }
  if (!navigator.storage?.getDirectory) {
    throw new Error('Trình duyệt chưa hỗ trợ lưu video local. Hãy dùng Chrome/Edge hoặc ứng dụng điện thoại.');
  }
}
