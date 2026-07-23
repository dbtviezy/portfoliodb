import type { LangCode } from "@/lib/content";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Skip translating URLs, emails, handles, pure numbers / stats like 5+. */
export function shouldSkipTranslation(text: string): boolean {
  const value = text.trim();
  if (!value) return true;
  if (/^https?:\/\//i.test(value)) return true;
  if (/^[\w.+-]+@[\w.-]+\.\w+$/i.test(value)) return true;
  if (/^@[\w.]+$/.test(value)) return true;
  if (/^[\d+\-–—.\s%]+$/.test(value)) return true;
  if (/^(behance|dribbble|instagram|t\.me)\./i.test(value)) return true;
  return false;
}

async function translateWithGoogle(text: string, from: LangCode, to: LangCode): Promise<string> {
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Translate failed (${response.status})`);
  }
  const data = (await response.json()) as unknown;
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("Unexpected translate response");
  }
  return (data[0] as unknown[])
    .map((part) => (Array.isArray(part) ? String(part[0] ?? "") : ""))
    .join("")
    .trim();
}

async function translateWithOpenAI(
  fields: Record<string, string>,
  from: LangCode,
  to: LangCode
): Promise<Record<string, string> | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_TRANSLATE_MODEL?.trim() || "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `You translate portfolio copy from ${from} to ${to}. ` +
            `Input is a JSON object of string fields. Return the same keys with translated values. ` +
            `Keep brand names, product names, URLs, emails, @handles, and short stats (e.g. 5+) unchanged. ` +
            `Sound natural for a motion/design portfolio.`,
        },
        { role: "user", content: JSON.stringify(fields) },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    console.warn("[translate] OpenAI failed, falling back:", response.status, detail.slice(0, 200));
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = payload.choices?.[0]?.message?.content;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result: Record<string, string> = {};
    for (const key of Object.keys(fields)) {
      result[key] = typeof parsed[key] === "string" ? String(parsed[key]) : fields[key];
    }
    return result;
  } catch {
    return null;
  }
}

export async function translateText(
  text: string,
  from: LangCode,
  to: LangCode
): Promise<string> {
  if (from === to) return text;
  if (shouldSkipTranslation(text)) return text;
  return translateWithGoogle(text, from, to);
}

/**
 * Translate many named fields. Prefers OpenAI when OPENAI_API_KEY is set,
 * otherwise uses free Google translate endpoint field-by-field.
 */
export async function translateFields(
  fields: Record<string, string>,
  from: LangCode,
  to: LangCode
): Promise<Record<string, string>> {
  if (from === to) return { ...fields };

  const entries = Object.entries(fields);
  const skippable = Object.fromEntries(
    entries.filter(([, value]) => shouldSkipTranslation(value))
  );
  const translatable = Object.fromEntries(
    entries.filter(([, value]) => !shouldSkipTranslation(value))
  );

  if (Object.keys(translatable).length === 0) {
    return { ...fields };
  }

  const viaOpenAI = await translateWithOpenAI(translatable, from, to);
  if (viaOpenAI) {
    return { ...fields, ...skippable, ...viaOpenAI };
  }

  const translated: Record<string, string> = {};
  for (const [key, value] of Object.entries(translatable)) {
    translated[key] = await translateWithGoogle(value, from, to);
    await sleep(40);
  }
  return { ...fields, ...skippable, ...translated };
}

export async function translateStringList(
  items: string[],
  from: LangCode,
  to: LangCode
): Promise<string[]> {
  if (items.length === 0 || from === to) return [...items];
  const mapped = await translateFields(
    Object.fromEntries(items.map((item, index) => [`i${index}`, item])),
    from,
    to
  );
  return items.map((_, index) => mapped[`i${index}`] ?? items[index]);
}
