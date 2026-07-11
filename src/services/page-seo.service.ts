import { apiDelete, apiGet, apiPut } from '@/lib/axios';
import type { PageSeoInput, PageSeoKey, PageSeoSetting } from '@/types/page-seo';

export const pageSeoService = {
  list(): Promise<PageSeoSetting[]> {
    return apiGet<PageSeoSetting[]>('/page-seo/admin');
  },
  update(pageKey: PageSeoKey, input: PageSeoInput): Promise<PageSeoSetting> {
    return apiPut<PageSeoSetting>(`/page-seo/admin/${pageKey}`, input);
  },
  remove(pageKey: PageSeoKey): Promise<void> {
    return apiDelete<void>(`/page-seo/admin/${pageKey}`);
  },
};
