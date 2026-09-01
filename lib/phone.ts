export const PHONE_NORMALIZED_SQL = "REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(Telefono, ' ', ''), '-', ''), '(', ''), ')', ''), '+', '')";

export function normalizePhone(value: unknown): string {
  return String(value || '').replace(/\D/g, '');
}
