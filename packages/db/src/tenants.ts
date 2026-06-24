import { Prisma } from "@prisma/client";
import { prisma } from "./client";
import { appendAuditLogInTransaction } from "./audit-log";

export type CreateTenantInput = {
  name: string;
  slug: string;
  ownerEmail: string;
  ownerName?: string;
};

export async function createTenant(input: CreateTenantInput) {
  return prisma.$transaction(
    async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: input.name,
          slug: input.slug,
          roles: {
            create: [
              {
                name: "Owner",
                permissions: ["*"]
              },
              {
                name: "Reviewer",
                permissions: ["workflow:read", "approval:write", "audit:read"]
              },
              {
                name: "Member",
                permissions: ["workflow:write", "document:write"]
              }
            ]
          }
        },
        include: {
          roles: true
        }
      });

      const ownerRole = tenant.roles.find((role) => role.name === "Owner");

      if (!ownerRole) {
        throw new Error("Default Owner role was not created.");
      }

      const user = await tx.user.upsert({
        where: {
          email: input.ownerEmail
        },
        update: {
          name: input.ownerName
        },
        create: {
          email: input.ownerEmail,
          name: input.ownerName
        }
      });

      await tx.tenantMembership.create({
        data: {
          tenantId: tenant.id,
          userId: user.id,
          roleId: ownerRole.id,
          status: "ACTIVE"
        }
      });

      await appendAuditLogInTransaction(
        tx,
        {
          tenantId: tenant.id,
          userId: user.id,
          role: "Owner",
          permissions: ["*"]
        },
        {
          eventType: "TENANT_CREATED",
          payload: {
            tenantId: tenant.id,
            tenantSlug: tenant.slug,
            ownerUserId: user.id
          }
        }
      );

      return {
        tenant,
        owner: user
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );
}

export async function listTenantsForUser(userId: string) {
  return prisma.tenant.findMany({
    where: {
      memberships: {
        some: {
          userId,
          status: "ACTIVE"
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
}

