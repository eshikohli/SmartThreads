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

export interface SummaryMessage {
  id: string;
  content: string;
  category: string;
  createdAt: string;
  authorName: string | null;
  authorEmail: string;
  parentMessageId: string | null;
}

export interface SummaryResult {
  bullets: string[];
}

const SUMMARY_SYSTEM_PROMPT = `You are a conversation summarizer for a team chat application.

OUTPUT FORMAT:
Return ONLY a valid JSON object with this exact structure:
{"bullets":["bullet 1","bullet 2",...]}

No markdown, no prose, no extra keys. Just the JSON object with 3-8 bullet strings.

RULES BY INTENT FILTER:

If intentFilter is "All":
- Produce a concise summary of the recent conversation (3-6 bullets preferred)
- Prioritize: decisions made, open questions, next steps, scheduling details
- Each bullet should be a complete, standalone insight

If intentFilter is a specific tag (Decision/Question/Update/Concern/Scheduling/FYI):
- DO NOT summarize the whole conversation
- ONLY list items matching that specific intent
- Keep each bullet <= 12 words when possible

Intent-specific formats:
- Decision: "Team decided/Agreed to [decision]"
- Scheduling: List meeting times/dates and planned check-ins
- Question: List the most recent questions (prioritize unanswered ones if detectable)
- Update: List status updates and progress reports
- Concern: List concerns, risks, and blockers
- FYI: List key informational items shared`;

export async function summarizeMessages(
  messages: SummaryMessage[],
  intentFilter: string
): Promise<SummaryResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { bullets: ["Summary unavailable: API key not configured"] };
  }

  if (messages.length === 0) {
    return { bullets: ["No messages to summarize"] };
  }

  const messagesText = messages
    .map((m) => {
      const author = m.authorName || m.authorEmail;
      const isReply = m.parentMessageId ? " [reply]" : "";
      return `[${m.category}${isReply}] ${author}: ${m.content}`;
    })
    .join("\n");

  const userPrompt = `Intent filter: ${intentFilter}

Messages to summarize:
${messagesText}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SUMMARY_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("OpenAI API error:", await response.text());
      return { bullets: ["Failed to generate summary"] };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    const parsed = JSON.parse(content);

    if (Array.isArray(parsed.bullets) && parsed.bullets.length > 0) {
      return { bullets: parsed.bullets.map(String) };
    }

    return { bullets: ["No summary generated"] };
  } catch (error) {
    console.error("Summary generation failed:", error);
    return { bullets: ["Failed to generate summary"] };
  }
}

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
