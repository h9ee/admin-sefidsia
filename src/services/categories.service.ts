import { apiDelete, apiGet, apiPatch, apiPost } from "@/lib/axios";
import type { Category, CategoryNode, CategoryStatus } from "@/types";

export type CategoryPayload = {
  name: string;
  slug?: string;
  shortDescription?: string | null;
  description?: string | null;
  icon?: string | null;
  coverImage?: string | null;
  coverImageAlt?: string | null;
  color?: string | null;
  parentId?: number | null;
  status?: CategoryStatus;
  isFeatured?: boolean;
  sortOrder?: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  metaKeywords?: string | null;
  ogImage?: string | null;
  canonicalUrl?: string | null;
  noIndex?: boolean;
};

export const categoriesService = {
  listFlat() {
    return apiGet<Category[]>("/categories");
  },
  listTree() {
    return apiGet<CategoryNode[]>("/categories", { tree: true });
  },
  get(id: number) {
    return apiGet<Category>(`/categories/${id}`);
  },
  create(payload: CategoryPayload) {
    return apiPost<Category>("/categories", payload);
  },
  update(id: number, payload: Partial<CategoryPayload>) {
    return apiPatch<Category>(`/categories/${id}`, payload);
  },
  remove(id: number) {
    return apiDelete(`/categories/${id}`);
  },
};

/** Flatten a tree into `[{id, name, depth, parentId}, …]` for select inputs. */
export function flattenTree(nodes: CategoryNode[]): CategoryNode[] {
  const out: CategoryNode[] = [];
  const walk = (list: CategoryNode[]) => {
    for (const n of list) {
      out.push(n);
      if (n.children?.length) walk(n.children);
    }
  };
  walk(nodes);
  return out;
}

/** Indented label like `— — قلب و عروق` so depth is visible inside a flat select. */
export function indentedLabel(node: CategoryNode): string {
  const indent = node.depth > 1 ? "— ".repeat(node.depth - 1) : "";
  return `${indent}${node.name}`;
}
