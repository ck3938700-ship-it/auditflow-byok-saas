import { assessWorkflowRisk, type RiskAssessment } from "./risk-rules";

export type WorkflowDecision = {
  risk: RiskAssessment;
  nextStatus: "RUNNING" | "WAITING_APPROVAL";
};

export function decideWorkflowPath(userInput: string): WorkflowDecision {
  const risk = assessWorkflowRisk(userInput);

  return {
    risk,
    nextStatus: risk.approvalRequired ? "WAITING_APPROVAL" : "RUNNING"
  };
}

export function canFinalizeWorkflow(status: string) {
  return status === "APPROVED" || status === "RUNNING";
}

