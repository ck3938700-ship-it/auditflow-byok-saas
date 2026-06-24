import { Prisma } from "@prisma/client";
import { decideWorkflowPath } from "@auditflow/workflow";
import { prisma } from "./client";
import { appendAuditLogInTransaction } from "./audit-log";
import type { TenantContext } from "./tenant";

export type CreateWorkflowInput = {
  title: string;
  type:
    | "ASK_AI"
    | "DRAFT_GENERATION"
    | "HR_REVIEW"
    | "LEGAL_REVIEW"
    | "FINANCE_REVIEW"
    | "COMPLIANCE_REVIEW";
  input: {
    prompt?: string;
    question?: string;
    [key: string]: Prisma.InputJsonValue | undefined;
  };
};

export async function listWorkflows(context: TenantContext) {
  return prisma.workflow.findMany({
    where: {
      tenantId: context.tenantId
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 50
  });
}

export async function createWorkflow(
  context: TenantContext,
  input: CreateWorkflowInput
) {
  return prisma.$transaction(
    async (tx) => {
      const prompt = String(input.input.prompt ?? input.input.question ?? "");
      const decision = decideWorkflowPath(prompt);

      const workflow = await tx.workflow.create({
        data: {
          tenantId: context.tenantId,
          createdByUserId: context.userId,
          type: input.type,
          title: input.title,
          input: input.input as Prisma.InputJsonValue,
          status: decision.nextStatus,
          riskScore: decision.risk.score,
          riskLevel: decision.risk.level,
          approvalRequired: decision.risk.approvalRequired
        }
      });

      await appendAuditLogInTransaction(tx, context, {
        eventType: "WORKFLOW_CREATED",
        workflowId: workflow.id,
        payload: {
          workflowId: workflow.id,
          type: workflow.type,
          title: workflow.title,
          riskScore: workflow.riskScore,
          riskLevel: workflow.riskLevel,
          approvalRequired: workflow.approvalRequired
        }
      });

      await appendAuditLogInTransaction(tx, context, {
        eventType: "WORKFLOW_RISK_SCORED",
        workflowId: workflow.id,
        payload: {
          workflowId: workflow.id,
          riskScore: decision.risk.score,
          riskLevel: decision.risk.level,
          reasons: decision.risk.reasons
        }
      });

      if (decision.risk.approvalRequired) {
        const approval = await tx.approval.create({
          data: {
            tenantId: context.tenantId,
            workflowId: workflow.id,
            requestedByUserId: context.userId,
            reason: decision.risk.reasons.join("; ")
          }
        });

        await appendAuditLogInTransaction(tx, context, {
          eventType: "APPROVAL_REQUESTED",
          workflowId: workflow.id,
          payload: {
            workflowId: workflow.id,
            approvalId: approval.id,
            reason: approval.reason
          }
        });
      }

      return workflow;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable
    }
  );
}
