export type MessageRole = "user" | "assistant" | "system";

export type MessageType =
  | "message"
  | "notes"
  | "test"
  | "exercise"
  | "feedback"
  | "success"
  | "code";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  type?: MessageType;
  timestamp?: string;
}

export interface ChatSession {
  chat_id: string;
  title?: string;
  messages: ChatMessage[];
  metadata?: Record<string, unknown>;
}

export interface ChatDocument {
  doc_id: string;
  filename: string;
  pages?: number;
  uploaded_at?: string;
  chunk_count?: number;
}

export interface StudyAgentsApiResponse<T = Record<string, unknown>> {
  success?: boolean;
  error?: string;
  detail?: string;
  data?: T;
}

/** Micro-concepto del grafo por chat (Fase 1). */
export interface ConceptNode {
  concept_id: string;
  name: string;
  description?: string;
  prerequisites?: string[];
  source_doc?: string;
  source_pages?: number[];
  mastery?: number;
}

export interface MasteryMap {
  [conceptId: string]: number;
}
