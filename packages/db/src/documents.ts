import { prisma } from "./client";
import { appendAuditLog } from "./audit-log";
import type { TenantContext } from "./tenant";
import { chunkText, type ChunkOptions } from "@auditflow/rag";

export async function listDocuments(context: TenantContext) {
  return prisma.document.findMany({
    where: {
      tenantId: context.tenantId
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 50
  });
}

export async function createDocumentMetadata(
  context: TenantContext,
  input: {
    title: string;
    sourceType: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: bigint;
    checksumSha256: string;
    metadata?: Record<string, unknown>;
  }
) {
  const document = await prisma.document.create({
    data: {
      tenantId: context.tenantId,
      uploadedByUserId: context.userId,
      title: input.title,
      sourceType: input.sourceType,
      storageKey: input.storageKey,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      checksumSha256: input.checksumSha256,
      metadata: input.metadata as object | undefined
    }
  });

  await appendAuditLog(context, {
    eventType: "DOCUMENT_UPLOADED",
    payload: {
      documentId: document.id,
      title: document.title,
      storageKey: document.storageKey,
      mimeType: document.mimeType,
      sizeBytes: String(document.sizeBytes)
    }
  });

  return document;
}

export async function replaceDocumentChunks(
  context: TenantContext,
  input: {
    documentId: string;
    text: string;
    options?: ChunkOptions;
  }
) {
  const document = await prisma.document.findFirst({
    where: {
      id: input.documentId,
      tenantId: context.tenantId
    }
  });

  if (!document) {
    throw new Error("Document was not found in this tenant.");
  }

  const chunks = chunkText(input.text, input.options);

  await prisma.$transaction(async (tx) => {
    await tx.embedding.deleteMany({
      where: {
        tenantId: context.tenantId,
        chunk: {
          documentId: document.id
        }
      }
    });

    await tx.documentChunk.deleteMany({
      where: {
        tenantId: context.tenantId,
        documentId: document.id
      }
    });

    if (chunks.length) {
      await tx.documentChunk.createMany({
        data: chunks.map((chunk) => ({
          tenantId: context.tenantId,
          documentId: document.id,
          chunkIndex: chunk.chunkIndex,
          content: chunk.content,
          tokenCount: chunk.tokenCount
        }))
      });
    }

    await tx.document.update({
      where: {
        id: document.id
      },
      data: {
        status: "READY"
      }
    });
  });

  await appendAuditLog(context, {
    eventType: "DOCUMENT_CHUNKED",
    payload: {
      documentId: document.id,
      title: document.title,
      chunkCount: chunks.length
    }
  });

  return {
    documentId: document.id,
    chunkCount: chunks.length,
    chunks
  };
}
