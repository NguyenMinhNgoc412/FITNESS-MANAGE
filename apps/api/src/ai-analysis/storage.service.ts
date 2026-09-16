import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
@Injectable()
export class PrivateMediaStorage {
  private client?: SupabaseClient;
  constructor(private readonly config: ConfigService) {}
  async createUploadAuthorization(path: string) {
    const { data, error } = await this.storage().createSignedUploadUrl(path);
    if (error) throw new ServiceUnavailableException('Không thể cấp quyền upload private media.');
    return { path: data.path, token: data.token, signedUrl: data.signedUrl, bucket: this.config.get<string>('SUPABASE_MEDIA_BUCKET') ?? 'body-videos' };
  }
  async assertUploaded(path: string) {
    const slash = path.lastIndexOf('/'); const folder = path.slice(0, slash); const name = path.slice(slash + 1);
    const { data, error } = await this.storage().list(folder, { search: name, limit: 10 });
    if (error || !data.some((item) => item.name === name)) throw new ServiceUnavailableException('Chưa tìm thấy video đã upload trong private storage.');
  }
  async createDownloadUrl(path: string) {
    const { data, error } = await this.storage().createSignedUrl(path, 300);
    if (error) throw new ServiceUnavailableException('Không thể cấp quyền đọc private media.');
    return data.signedUrl;
  }
  private storage() {
    if (!this.client) {
      const url = this.config.get<string>('SUPABASE_URL'); const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
      if (!url || !key) throw new ServiceUnavailableException('Private storage chưa được cấu hình.');
      this.client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    }
    return this.client.storage.from(this.config.get<string>('SUPABASE_MEDIA_BUCKET') ?? 'body-videos');
  }
}
