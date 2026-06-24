import { Prisma } from "@prisma/client";
import { prisma } from "./client";
import { appendAuditLogInTransaction } from "./audit-log";
import type { TenantContext } from "./tenant";

export async function listApprovals(context: TenantContext) {
  return prisma.approval.findMany({
    where: {
      tenantId: context.tenantId,
      status: "PENDING"
    },
    include: {
      workflow: true
    },
    orderBy: {
      createdAt: "asc"
    }
  });
}

export async function decideApproval(
  context: TenantContext,
  input: {
    approvalId: string;
    decision: "APPROVED" | "REJECTED";
    decisionNote?: string;
  }
) {
  return prisma.$transaction(
    async (tx) => {
      const existing = await tx.approval.findFirst({
        where: {
          id: input.approvalId,
          tenantId: context.tenantId
        }
      });

      if (!existing) {
        throw new Error("Approval was not found in this tenant.");
      }

      const approval = await tx.approval.update({
        where: {
          id: existing.id
        },
        data: {
          status: input.decision,
          reviewerUserId: context.userId,
          decisionNote: input.decisionNote,
          decidedAt: new Date()
        }
      });

      await tx.workflow.update({
        where: {
          id: approval.workflowId
        },
        data: {
          status: input.decision
        }
      });

      await appendAuditLogInTransaction(tx, context, {
        eventType: "APPROVAL_DECISIONED",
        workflowId: approval.workflowId,
        payload: {
          approvalId: approval.id,
          workflowId: approval.workflowId,
          decision: input.decision,
          decisionNote: input.decisionNote ?? null
        }
      });

      return approval;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );
}
