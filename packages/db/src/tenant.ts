export type TenantContext = {
  tenantId: string;
  userId?: string;
  role?: string;
  permissions?: string[];
};

export function requireTenantContext(context: Partial<TenantContext>): TenantContext {
  if (!context.tenantId) {
    throw new Error("Tenant context is required for every backend operation.");
  }

  return {
    tenantId: context.tenantId,
    userId: context.userId,
    role: context.role,
    permissions: context.permissions ?? []
  };
}

export function scopedTenantWhere<T extends Record<string, unknown>>(
  context: TenantContext,
  where?: T
) {
  return {
    ...(where ?? {}),
    tenantId: context.tenantId
  };
}

