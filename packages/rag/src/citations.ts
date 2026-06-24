export type Citation = {
  documentId: string;
  documentTitle: string;
  chunkIndex: number;
  citationText: string;
  score: number;
};

export function formatCitationLabel(citation: Citation, index: number) {
  return `[${index + 1}] ${citation.documentTitle} #${citation.chunkIndex}`;
}

export function formatCitationBlock(citations: Citation[]) {
  if (!citations.length) {
    return "No retrieved context.";
  }

  return citations
    .map(
      (citation, index) =>
        `${formatCitationLabel(citation, index)}\n${citation.citationText}`
    )
    .join("\n\n");
}

