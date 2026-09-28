import { useState } from 'react';
import { Card, Choices, Form, Label, LoadState, Page, Pager, RecordPicker, Badge, mutation, useLoad } from '../ui';
import { Person } from '../models';
export default function People() {
  const [role, setRole] = useState('PT'), [page, setPage] = useState(1), [selected, setSelected] = useState('');
  const [ptPage, setPtPage] = useState(1);
  const state = useLoad<Person[]>('/people?role=' + role + '&page=' + page), pts = useLoad<Person[]>('/people?role=PT&page=' + ptPage);
  const history = useLoad<{ id: string; ptId: string; status: string; reason: string }[]>(selected && role === 'MEMBER' ? '/members/' + selected + '/pt-assignment/history' : null);
  return <Page title="Hồ sơ & PT assignment" subtitle="Owner quản lý hồ sơ chính thức và PT chính của Member.">
    {role === 'MEMBER' && <Card title="Trang PT để chọn assignment"><Pager page={ptPage} setPage={setPtPage} more={pts.data?.length === 30} /></Card>}
    <Choices value={role} onChange={v => { setRole(v); setPage(1); setSelected(''); }} options={[{ value: 'PT', label: 'Huấn luyện viên' }, { value: 'MEMBER', label: 'Hội viên' }]} />
    <Card title={role === 'PT' ? 'Tạo PT nội bộ' : 'Tạo Member mới'}><Form key={role} fields={[{ name: 'fullName', label: 'Họ tên' }, { name: 'phone', label: 'SĐT', numeric: true }, { name: 'cccd', label: 'CCCD', numeric: true }, { name: 'password', label: 'Mật khẩu (ít nhất 10 ký tự)', secret: true }]} submit={(v, k) => mutation('/people', { ...v, role }, k)} onSuccess={() => void state.reload()} /></Card>
    <LoadState state={state} empty={!state.data?.length} emptyText={role === 'PT' ? 'Chưa có PT nội bộ.' : 'Chưa có Member chính thức.'} /><RecordPicker label={role === 'PT' ? 'Danh sách PT' : 'Danh sách Member'} value={selected} onChange={setSelected} options={(state.data ?? []).map(p => ({ value: p.id, label: p.profile.fullName, meta: p.phone }))} /><Pager page={page} setPage={setPage} more={state.data?.length === 30} />
    {selected && <><Card title="Cập nhật hồ sơ"><Form key={selected} fields={[{ name: 'fullName', label: 'Họ tên mới (để trống nếu giữ nguyên)' }, { name: 'cccd', label: 'CCCD mới (để trống nếu giữ nguyên)', numeric: true }, { name: 'status', label: 'Trạng thái', options: [{ value: 'ACTIVE', label: 'Hoạt động' }, { value: 'INACTIVE', label: 'Ngừng hoạt động' }, { value: 'LOCKED', label: 'Khóa' }] }, { name: 'reason', label: 'Lý do thay đổi' }]} submit={(v, k) => mutation('/people/' + selected, Object.fromEntries(Object.entries(v).filter(([, value]) => value !== '')), k, 'patch')} onSuccess={() => void state.reload()} /></Card>
      {role === 'MEMBER' && <><Card title="Gán / đổi PT chính"><LoadState state={pts} /><Form key={selected + ':pt'} fields={[{ name: 'ptId', label: 'PT nội bộ', picker: true, options: (pts.data ?? []).filter(p => p.status === 'ACTIVE').map(p => ({ value: p.id, label: p.profile.fullName })) }, { name: 'reason', label: 'Lý do' }]} submit={(v, k) => mutation('/members/' + selected + '/pt-assignment', v, k)} onSuccess={() => void history.reload()} /></Card>
        <Card title="Hủy assignment"><Form fields={[{ name: 'reason', label: 'Lý do hủy' }]} label="Xác nhận hủy PT" submit={(v, k) => mutation('/members/' + selected + '/pt-assignment', v, k, 'delete')} onSuccess={() => void history.reload()} /></Card>
        <Card title="Lịch sử assignment"><LoadState state={history} empty={!history.data?.length} />{history.data?.map(item => <Card key={item.id}><Badge value={item.status} /><Label>{pts.data?.find(p => p.id === item.ptId)?.profile.fullName ?? 'PT nội bộ'}</Label><Label muted>{item.reason}</Label></Card>)}</Card>
      </>}
    </>}
  </Page>;
}
