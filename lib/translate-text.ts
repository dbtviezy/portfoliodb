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

/**
 * Detect RU vs EN from text (Cyrillic share).
 * Ignores URLs/emails/handles when sampling.
 */
export function detectRuOrEn(sample: string, fallback: LangCode = "en"): LangCode {
  const cleaned = sample
    .split(/\s+/)
    .filter((token) => !shouldSkipTranslation(token))
    .join(" ");
  const letters = cleaned.replace(/[^a-zA-Zа-яА-ЯёЁ]/gu, "");
  if (!letters) return fallback;
  const cyrillic = (letters.match(/[а-яА-ЯёЁ]/gu) || []).length;
  return cyrillic / letters.length >= 0.25 ? "ru" : "en";
}

export function detectRuOrEnFromFields(
  fields: Record<string, string>,
  fallback: LangCode = "en"
): LangCode {
  const sample = Object.values(fields)
    .filter((value) => !shouldSkipTranslation(value))
    .join("\n");
  return detectRuOrEn(sample, fallback);
}

export function otherLang(lang: LangCode): LangCode {
  return lang === "en" ? "ru" : "en";
}

/** Resolve translate direction from real text (+ optional Studio hint). */
export function resolveTranslatePair(
  fields: Record<string, string>,
  hint?: LangCode
): { from: LangCode; to: LangCode; detected: LangCode } {
  const detected = detectRuOrEnFromFields(fields, hint ?? "en");
  return { from: detected, to: otherLang(detected), detected };
}

async function translateWithGoogle(
  text: string,
  from: LangCode | "auto",
  to: LangCode
): Promise<{ text: string; detected: string }> {
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
  const translated = (data[0] as unknown[])
    .map((part) => (Array.isArray(part) ? String(part[0] ?? "") : ""))
    .join("")
    .trim();
  const detected = typeof data[2] === "string" ? data[2] : from === "auto" ? to : from;
  return { text: translated, detected };
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
            `Auto-detect if a field is already in the target language and leave it unchanged. ` +
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
  from: LangCode | "auto",
  to: LangCode
): Promise<string> {
  if (shouldSkipTranslation(text)) return text;
  const resolvedFrom =
    from === "auto" ? detectRuOrEn(text, to === "ru" ? "en" : "ru") : from;
  if (resolvedFrom === to) return text;
  const result = await translateWithGoogle(text, "auto", to);
  return result.text;
}

export type TranslateFieldsResult = {
  fields: Record<string, string>;
  from: LangCode;
  to: LangCode;
};

/**
 * Translate many named fields.
 * Direction is auto-detected from text (RU↔EN) unless from/to are forced.
 */
export async function translateFields(
  fields: Record<string, string>,
  from: LangCode | "auto" = "auto",
  to?: LangCode
): Promise<TranslateFieldsResult> {
  const pair =
    from === "auto" || !to
      ? resolveTranslatePair(fields, typeof from === "string" && from !== "auto" ? from : "en")
      : { from, to, detected: from };

  const source = pair.from;
  const target = pair.to;

  if (source === target) {
    return { fields: { ...fields }, from: source, to: target };
  }

  const entries = Object.entries(fields);
  const skippable = Object.fromEntries(
    entries.filter(([, value]) => shouldSkipTranslation(value))
  );
  const translatable = Object.fromEntries(
    entries.filter(([, value]) => !shouldSkipTranslation(value))
  );

  if (Object.keys(translatable).length === 0) {
    return { fields: { ...fields }, from: source, to: target };
  }

  const viaOpenAI = await translateWithOpenAI(translatable, source, target);
  if (viaOpenAI) {
    return {
      fields: { ...fields, ...skippable, ...viaOpenAI },
      from: source,
      to: target,
    };
  }

  const translated: Record<string, string> = {};
  for (const [key, value] of Object.entries(translatable)) {
    // Per-field: if this field looks like the target already, keep it.
    const fieldLang = detectRuOrEn(value, source);
    if (fieldLang === target) {
      translated[key] = value;
      continue;
    }
    const result = await translateWithGoogle(value, "auto", target);
    translated[key] = result.text;
    await sleep(40);
  }

  return {
    fields: { ...fields, ...skippable, ...translated },
    from: source,
    to: target,
  };
}

export async function translateStringList(
  items: string[],
  from: LangCode | "auto" = "auto",
  to?: LangCode
): Promise<{ items: string[]; from: LangCode; to: LangCode }> {
  if (items.length === 0) {
    const fallback = typeof from === "string" && from !== "auto" ? from : "en";
    return {
      items: [],
      from: fallback,
      to: to ?? otherLang(fallback),
    };
  }
  const mapped = await translateFields(
    Object.fromEntries(items.map((item, index) => [`i${index}`, item])),
    from,
    to
  );
  return {
    items: items.map((_, index) => mapped.fields[`i${index}`] ?? items[index]),
    from: mapped.from,
    to: mapped.to,
  };
}
