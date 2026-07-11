export const PAGE_SEO_KEYS = [
  'home', 'articles', 'categories', 'questions', 'doctors', 'tags',
  'about', 'contact-us', 'terms', 'privacy', 'doctor-apply',
] as const;

export type PageSeoKey = (typeof PAGE_SEO_KEYS)[number];

export interface PageSeoSetting {
  id: number;
  pageKey: PageSeoKey;
  title: string | null;
  description: string | null;
  focusKeyword: string | null;
  keywords: string[] | null;
  canonicalUrl: string | null;
  robotsIndex: boolean | null;
  robotsFollow: boolean | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  ogImageAlt: string | null;
  twitterCard: 'summary' | 'summary_large_image' | null;
  createdAt: string;
  updatedAt: string;
}

export type PageSeoInput = Omit<PageSeoSetting, 'id' | 'pageKey' | 'createdAt' | 'updatedAt'>;
