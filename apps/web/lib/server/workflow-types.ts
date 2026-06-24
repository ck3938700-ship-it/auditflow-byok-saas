export const workflowTypes = [
  "ASK_AI",
  "DRAFT_GENERATION",
  "HR_REVIEW",
  "LEGAL_REVIEW",
  "FINANCE_REVIEW",
  "COMPLIANCE_REVIEW"
] as const;

export type WorkflowType = (typeof workflowTypes)[number];

export function parseWorkflowType(value: unknown): WorkflowType {
  if (typeof value === "string" && workflowTypes.includes(value as WorkflowType)) {
    return value as WorkflowType;
  }

  return "ASK_AI";
}

