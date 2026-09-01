export const CATEGORY_TYPES = ['SERVICIO', 'PRODUCTO', 'EXTRA'] as const;

export type CategoryType = (typeof CATEGORY_TYPES)[number];

export const CATEGORY_TYPE_LABELS: Record<CategoryType, string> = {
  SERVICIO: 'Servicio',
  PRODUCTO: 'Producto',
  EXTRA: 'Extra / Adicional',
};

export function isCategoryType(value: unknown): value is CategoryType {
  return typeof value === 'string' && CATEGORY_TYPES.includes(value as CategoryType);
}
