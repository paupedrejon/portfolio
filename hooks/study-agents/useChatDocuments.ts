"use client";

import { useCallback, useEffect, useState } from "react";
import type { ChatDocument } from "@/lib/study-agents/types";
import { saFetch } from "@/hooks/study-agents/useApiClient";

export function useChatDocuments(
  chatId: string | null,
  userId: string | null,
  apiKey?: string | null,
) {
  const [documents, setDocuments] = useState<ChatDocument[]>([]);
  const [loading, setLoading] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!chatId || !userId) {
      setDocuments([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({ chatId, userId });
      if (apiKey && apiKey !== "default") params.set("apiKey", apiKey);
      const { ok, data } = await saFetch<{
        success?: boolean;
        documents?: ChatDocument[];
      }>(`/chat-documents?${params.toString()}`);
      if (ok && data.documents) {
        setDocuments(data.documents);
      } else {
        setDocuments([]);
      }
    } finally {
      setLoading(false);
    }
  }, [chatId, userId, apiKey]);

  const deleteDocument = useCallback(
    async (docId: string) => {
      if (!chatId || !userId) return false;
      const params = new URLSearchParams({ chatId, userId });
      if (apiKey && apiKey !== "default") params.set("apiKey", apiKey);
      const { ok } = await saFetch(`/chat-documents/${encodeURIComponent(docId)}?${params}`, {
        method: "DELETE",
      });
      if (ok) {
        setDocuments((prev) => prev.filter((d) => d.doc_id !== docId));
      }
      return ok;
    },
    [chatId, userId, apiKey],
  );

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return { documents, loading, loadDocuments, deleteDocument };
}
