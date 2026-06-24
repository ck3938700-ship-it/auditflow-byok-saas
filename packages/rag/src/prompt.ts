import { formatCitationBlock, type Citation } from "./citations";

export function buildRagPrompt(question: string, citations: Citation[]) {
  return [
    "Use the retrieved context to answer the user's question.",
    "If the context is insufficient, say what is missing.",
    "Cite sources inline using labels like [1], [2].",
    "",
    "Retrieved context:",
    formatCitationBlock(citations),
    "",
    "Question:",
    question
  ].join("\n");
}

