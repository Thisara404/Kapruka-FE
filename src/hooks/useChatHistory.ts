import { useEffect } from "react";
import { fetchChatHistory } from "@/lib/api";

export const DEFAULT_GREETING_EN = `Hello! I'm **Thisari** — your Kapruka shopping assistant. Whether you're looking for the perfect birthday cake, a beautiful flower bouquet, or a thoughtful gift, I'm here to help!

What can I find for you today?`;

export const DEFAULT_GREETING_SI = `ආයුබෝවන්! මම **තිසරි** — ඔබේ කප්රුක සාප්පු සහායක. උපන්දින කේක්, මල් කැකුළු, හෝ ලස්සන තෑග්ගක් සොයන්නේ නම්, මම මෙහි ඉන්නේ ඔබට උදව් කරන්න!

අද ඔබට මොනවද සොයන්නේ?`;

export function makeWelcomeMessage(language: "en" | "si") {
  return {
    id: "welcome",
    role: "assistant" as const,
    parts: [
      {
        type: "text",
        text: language === "si" ? DEFAULT_GREETING_SI : DEFAULT_GREETING_EN,
      },
    ],
  };
}

interface UseChatHistoryOptions {
  sessionId: string;
  userId?: string;
  language: "en" | "si";
  accessToken?: string;
  setMessages: (msgs: any) => void;
  setHistoryLoaded: (v: boolean) => void;
}

export function useChatHistory({
  sessionId,
  userId,
  language,
  accessToken,
  setMessages,
  setHistoryLoaded,
}: UseChatHistoryOptions) {
  useEffect(() => {
    if (!sessionId) return;

    const load = async () => {
      try {
        const data = await fetchChatHistory(sessionId, accessToken);
        if (data.messages?.length > 0) {
          setMessages(data.messages);
        } else {
          setMessages([makeWelcomeMessage(language)]);
        }
      } catch {
        setMessages([makeWelcomeMessage(language)]);
      } finally {
        setHistoryLoaded(true);
      }
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, userId]);
}
