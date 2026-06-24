import { Prisma } from "@prisma/client";
import {
  assertNoProviderSecrets,
  buildAuditHash,
  type JsonValue
} from "@auditflow/audit";
import { prisma } from "./client";
import type { TenantContext } from "./tenant";

export type AppendAuditLogInput = {
  eventType:
    | "TENANT_CREATED"
    | "USER_JOINED"
    | "WORKFLOW_CREATED"
    | "WORKFLOW_RISK_SCORED"
    | "APPROVAL_REQUESTED"
    | "APPROVAL_DECISIONED"
    | "DOCUMENT_UPLOADED"
    | "DOCUMENT_CHUNKED"
    | "RETRIEVAL_PERFORMED"
    | "AI_OUTPUT_RECORDED"
    | "SETTINGS_UPDATED";
  workflowId?: string;
  payload: JsonValue;
};

export async function appendAuditLog(
  context: TenantContext,
  input: AppendAuditLogInput
) {
  return prisma.$transaction(
    async (tx) => appendAuditLogInTransaction(tx, context, input),
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );
}

export async function listAuditLogs(context: TenantContext) {
  return prisma.auditLog.findMany({
    where: {
      tenantId: context.tenantId
    },
    orderBy: {
      sequence: "desc"
    },
    take: 100
  });
}

export async function appendAuditLogInTransaction(
  tx: Prisma.TransactionClient,
  context: TenantContext,
  input: AppendAuditLogInput
) {
  assertNoProviderSecrets(input.payload);

  const previous = await tx.auditLog.findFirst({
    where: {
      tenantId: context.tenantId
    },
    orderBy: {
      sequence: "desc"
    },
    select: {
      sequence: true,
      entryHash: true
    }
  });

  const sequence = (previous?.sequence ?? 0n) + 1n;
  const createdAt = new Date();
  const hash = buildAuditHash({
    tenantId: context.tenantId,
    eventType: input.eventType,
    sequence,
    payload: input.payload,
    previousHash: previous?.entryHash ?? null,
    createdAt: createdAt.toISOString()
  });

  return tx.auditLog.create({
    data: {
      tenantId: context.tenantId,
      userId: context.userId,
      workflowId: input.workflowId,
      eventType: input.eventType,
      sequence,
      payload: input.payload as Prisma.InputJsonValue,
      previousHash: previous?.entryHash ?? null,
      entryHash: hash.entryHash,
      createdAt
    }
  });
}
