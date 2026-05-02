// Legacy stubs — data now lives in Neon PostgreSQL
export const orders: any[] = []
export const customers: any[] = []
export function recalculateCustomerStats(_phone: string) {
  // No-op — handled in API route via SQL
}
