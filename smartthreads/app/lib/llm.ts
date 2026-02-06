export type MessageCategory =
  | "Question"
  | "Update"
  | "Concern"
  | "Decision"
  | "FYI"
  | "Scheduling";

export interface AnalysisResult {
  category: MessageCategory;
  isRepetitive: boolean;
  matchedMessageId?: string;
  suggestedAnswer?: string;
}

interface HistoryMessage {
  id: string;
  content: string;
  category: string;
  timestamp: string;
}

const SYSTEM_PROMPT = `You are a message analyzer for a team chat application. Analyze the draft message and recent conversation history.

Your task:
1. Categorize the draft into exactly one category:
   - "Scheduling" - meeting times, availability, reschedule requests (this takes priority over Question for time/date coordination)
   - "Question" - asking for information or clarification
   - "Update" - status updates, progress reports
   - "Concern" - expressing worry, potential issues, blockers
   - "Decision" - announcing or requesting a decision
   - "FYI" - general information sharing

2. Check if the draft is repetitive:
   - If the draft asks something already answered in recent messages, set isRepetitive=true
   - If the draft claims/states something already covered, set isRepetitive=true
   - Include matchedMessageId (the id of the relevant prior message)
   - Include a brief suggestedAnswer referencing what was already said

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{"category":"<category>","isRepetitive":<boolean>,"matchedMessageId":"<id or null>","suggestedAnswer":"<string or null>"}`;

export async function analyzeMessage(
  draft: string,
  history: HistoryMessage[]
): Promise<AnalysisResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Fallback if no API key - return default analysis
    return { category: "FYI", isRepetitive: false };
  }

  const historyText = history
    .map((m) => `[${m.id}] (${m.category}, ${m.timestamp}): ${m.content}`)
    .join("\n");

  const userPrompt = `Recent messages (last ~30):
${historyText || "(no prior messages)"}

Draft message to analyze:
${draft}`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    console.error("OpenAI API error:", await response.text());
    return { category: "FYI", isRepetitive: false };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  try {
    const parsed = JSON.parse(content);
    return {
      category: parsed.category || "FYI",
      isRepetitive: !!parsed.isRepetitive,
      matchedMessageId: parsed.matchedMessageId || undefined,
      suggestedAnswer: parsed.suggestedAnswer || undefined,
    };
  } catch {
    console.error("Failed to parse LLM response:", content);
    return { category: "FYI", isRepetitive: false };
  }
}
