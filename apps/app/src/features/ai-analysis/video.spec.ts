import { createUploadKey, inferVideoMimeType } from './video';

describe('video upload contract', () => {
  it('chỉ nhận các MIME video backend hỗ trợ', () => {
    expect(inferVideoMimeType({ name: 'body.mp4' })).toBe('video/mp4');
    expect(inferVideoMimeType({ name: 'body.MOV' })).toBe('video/quicktime');
    expect(inferVideoMimeType({ name: 'body.avi', mimeType: 'video/avi' })).toBeNull();
  });

  it('tạo idempotency key ổn định từ input được kiểm soát', () => {
    expect(createUploadKey('member-1', 123, 0.5)).toBe('member-1-123-i');
  });
});
