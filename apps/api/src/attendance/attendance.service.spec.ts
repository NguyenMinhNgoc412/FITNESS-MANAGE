import { AttendanceStatus } from '@prisma/client';
import { resolveAttendanceStatus } from './attendance.service';
describe('resolveAttendanceStatus', () => {
  it('tạo exception Member only sau khi window kết thúc', () => expect(resolveAttendanceStatus(true, false, true)).toBe(AttendanceStatus.MEMBER_ONLY));
  it('không đánh dấu vắng khi window chưa kết thúc', () => expect(resolveAttendanceStatus(true, false, false)).toBe(AttendanceStatus.NEEDS_REVIEW));
  it('match khi cả Member và PT đều có evidence hợp lệ', () => expect(resolveAttendanceStatus(true, true, false)).toBe(AttendanceStatus.MATCHED));
});
