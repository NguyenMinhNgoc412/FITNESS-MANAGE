import { View } from 'react-native';
import { PopupRow } from '../components/record-row';
import { Badge, Card, Label, LoadState } from '../ui';
import { Form } from '../components/form';
import { dateTime } from '../lib/date-time';
import { mutation } from '../lib/http';
import { useLoad } from '../hooks/use-load';
import { useAuthStore } from '../store/auth';
import { ExternalRequest, Membership, Pass } from '../models';
import { PackageCard } from './packages';

export function MemberServices() {
  const memberId = useAuthStore(s => s.session!.user.id);
  const packages = useLoad<Membership[]>('/members/' + memberId + '/memberships');
  const pt = useLoad<{ pt: { profile: { fullName: string } } } | null>('/members/me/pt');
  const passes = useLoad<Pass[]>('/members/me/external-pt-passes');
  const requests = useLoad<ExternalRequest[]>('/external-pt/requests');
  return <>
    <Card title="Gói sở hữu"><LoadState state={packages} empty={!packages.data?.length} emptyText="Bạn chưa có gói tập đang được ghi nhận. Liên hệ Owner để kiểm tra." /><View>{packages.data?.map(item => <PackageCard key={item.id} item={item} />)}</View></Card>
    <Card title="PT chính"><LoadState state={pt} />{!pt.loading && !pt.error && <Label>{pt.data?.pt?.profile.fullName ?? 'Bạn chưa có PT nội bộ.'}</Label>}</Card>
    <Card title="External PT Pass"><LoadState state={passes} empty={!passes.data?.length} emptyText="Bạn chưa có External PT Pass." /><View>{passes.data?.map(p => <PopupRow key={p.id} title="External PT Pass" description={'Còn ' + (p.totalUses - p.usedUses) + ' / ' + p.totalUses + ' lượt'} trailing={<Badge value={p.status} />}><Badge value={p.status} /><Label>Còn {p.totalUses - p.usedUses} / {p.totalUses} lượt</Label></PopupRow>)}</View>
      <LoadState state={requests} /><View>{requests.data?.map(r => <PopupRow key={r.id} title="Yêu cầu dùng PT ngoài" description={dateTime(r.createdAt)}><Label>{dateTime(r.createdAt)}</Label><Label muted>Chỉ xác nhận nếu bạn đang dùng PT ngoài và đồng ý trừ một lượt pass cùng quyền vào tập.</Label><Form fields={[]} label="Đồng ý dùng pass" submit={(_, k) => mutation('/external-pt/checkin/' + r.id + '/confirm', {}, k)} onSuccess={() => { void requests.reload(); void passes.reload(); void packages.reload(); }} /></PopupRow>)}</View>
    </Card>
  </>;
}
