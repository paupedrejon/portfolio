import fs from "fs/promises";
import path from "path";
import ExactPromoClient from "../ExactPromoClient";

type BackendMessage = {
  role: "user" | "assistant" | "system";
  content: string;
  type?: string;
  timestamp?: string;
  topic?: string;
};

const SQL_CHAT_PATH = path.join(
  process.cwd(),
  "study_agents",
  "chats",
  "8109d3ff-dd73-4632-8bb9-c25793dcb5de",
  "chat-1767476933061.json"
);

export async function generateStaticParams() {
  return [];
}

export default async function Page({
  params,
}: {
  params: Promise<{ variant: string }>;
}) {
  const { variant } = await params;

  const raw = await fs.readFile(SQL_CHAT_PATH, "utf8");
  const fullChat = JSON.parse(raw) as { messages: BackendMessage[]; title?: string };

  const messages = Array.isArray(fullChat?.messages)
    ? fullChat.messages
    : [];

  const promoChatId = `promo-${variant}`;

  // Construimos subsets mínimos para que la tarjeta “real” de StudyChat aparezca.
  let subset: BackendMessage[] = [];
  if (variant === "v1-notes") {
    const notesIdx = messages.findIndex((m) => m.type === "notes");
    if (notesIdx >= 0) {
      const prev = notesIdx > 0 ? messages[notesIdx - 1] : null;
      subset = prev ? [prev, messages[notesIdx]] : [messages[notesIdx]];
    } else {
      subset = messages.slice(0, 4);
    }
  } else if (variant === "v2-feedback") {
    const userIdx = messages.findIndex(
      (m) =>
        m.type === "message" &&
        typeof m.content === "string" &&
        m.content.toLowerCase().includes("test completado")
    );
    const feedbackIdx = messages.findIndex((m) => m.type === "feedback");
    const maybeUser = userIdx >= 0 ? messages[userIdx] : null;
    subset =
      maybeUser && feedbackIdx >= 0
        ? [maybeUser, messages[feedbackIdx]]
        : feedbackIdx >= 0
          ? [messages[feedbackIdx]]
          : [];
  } else if (variant === "v3-exercise") {
    const erIdx = messages.findIndex((m) => m.type === "exercise_result");
    if (erIdx >= 0) {
      const prevUserIdx = (() => {
        for (let i = erIdx - 1; i >= 0; i--) {
          if (messages[i]?.role === "user") return i;
        }
        return -1;
      })();
      subset = prevUserIdx >= 0 ? [messages[prevUserIdx], messages[erIdx]] : [messages[erIdx]];
    } else {
      subset = [];
    }
  } else {
    subset = messages.slice(0, 4);
  }

  const promoChat = {
    chatTitle: "General",
    chatId: promoChatId,
    topic: "SQL",
    level: 5,
    uploadedFiles: [],
    selectedModel: "auto",
    messages: subset,
  };

  return (
    <ExactPromoClient
      variant={variant}
      userId="promo-user-1"
      promoChat={promoChat}
    />
  );
}

