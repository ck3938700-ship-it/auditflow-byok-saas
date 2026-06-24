export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type RiskAssessment = {
  score: number;
  level: RiskLevel;
  approvalRequired: boolean;
  reasons: string[];
};

const criticalTerms = [
  "terminate employee",
  "dismissal",
  "fire employee",
  "解雇",
  "辞退",
  "解除劳动合同",
  "重大合同修改",
  "付款审批",
  "财务处理"
];

const highTerms = [
  "contract modification",
  "legal liability",
  "salary adjustment",
  "vendor payment",
  "合同修改",
  "法律责任",
  "薪资调整",
  "供应商付款",
  "合规处罚"
];

const mediumTerms = [
  "policy change",
  "employee record",
  "invoice",
  "政策变更",
  "员工档案",
  "发票",
  "报销"
];

export function assessWorkflowRisk(input: string): RiskAssessment {
  const text = input.toLowerCase();
  const reasons: string[] = [];
  let score = 10;

  for (const term of criticalTerms) {
    if (text.includes(term.toLowerCase())) {
      score += 60;
      reasons.push(`Critical term matched: ${term}`);
    }
  }

  for (const term of highTerms) {
    if (text.includes(term.toLowerCase())) {
      score += 30;
      reasons.push(`High-risk term matched: ${term}`);
    }
  }

  for (const term of mediumTerms) {
    if (text.includes(term.toLowerCase())) {
      score += 15;
      reasons.push(`Medium-risk term matched: ${term}`);
    }
  }

  score = Math.min(score, 100);

  const level = toRiskLevel(score);

  return {
    score,
    level,
    approvalRequired: score >= 60,
    reasons: reasons.length ? reasons : ["No high-risk terms matched"]
  };
}

function toRiskLevel(score: number): RiskLevel {
  if (score >= 90) return "CRITICAL";
  if (score >= 60) return "HIGH";
  if (score >= 30) return "MEDIUM";
  return "LOW";
}
