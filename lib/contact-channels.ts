export type ContactChannelGroup = "primary" | "social";

export type ContactChannel = {
  label: string;
  value: string;
  url: string;
  group: ContactChannelGroup;
};

export function parseContactChannels(raw: string | null | undefined): ContactChannel[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => ({
        label: String(item?.label ?? "").trim(),
        value: String(item?.value ?? "").trim(),
        url: String(item?.url ?? "").trim(),
        group: item?.group === "social" ? ("social" as const) : ("primary" as const),
      }))
      .filter((item) => item.label && item.value);
  } catch {
    return [];
  }
}

export function serializeContactChannels(
  channels: ContactChannel[] | undefined | null
): string {
  if (!channels?.length) return "[]";
  return JSON.stringify(
    channels
      .map((item) => ({
        label: item.label.trim(),
        value: item.value.trim(),
        url: (item.url || guessChannelUrl(item.label, item.value)).trim(),
        group: item.group === "social" ? "social" : "primary",
      }))
      .filter((item) => item.label && item.value)
  );
}

/** Build mailto / t.me / https links when URL left blank */
export function guessChannelUrl(label: string, value: string): string {
  const v = value.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v) || /^mailto:/i.test(v)) return v;

  const key = label.trim().toLowerCase();
  if (key.includes("email") || key.includes("mail") || v.includes("@") && !v.startsWith("@") && v.includes(".")) {
    return `mailto:${v}`;
  }
  if (key.includes("telegram") || key.includes("tg")) {
    return `https://t.me/${v.replace(/^@/, "")}`;
  }
  if (key.includes("instagram") || key.includes("insta")) {
    return `https://instagram.com/${v.replace(/^@/, "").replace(/^instagram\.com\//i, "")}`;
  }
  if (key.includes("behance") || key.includes("dribbble") || key.includes("linkedin") || key.includes("twitter") || key.includes("x.com")) {
    return `https://${v.replace(/^https?:\/\//i, "")}`;
  }
  if (v.includes(".") && !v.includes(" ")) {
    return `https://${v.replace(/^https?:\/\//i, "")}`;
  }
  return v;
}

export type LegacyContactFields = {
  email?: string;
  telegram?: string;
  behance?: string;
  dribbble?: string;
  instagram?: string;
};

export function channelsFromLegacy(fields: LegacyContactFields): ContactChannel[] {
  const out: ContactChannel[] = [];
  if (fields.email?.trim()) {
    out.push({
      label: "Email",
      value: fields.email.trim(),
      url: `mailto:${fields.email.trim()}`,
      group: "primary",
    });
  }
  if (fields.telegram?.trim()) {
    out.push({
      label: "Telegram",
      value: fields.telegram.trim(),
      url: `https://t.me/${fields.telegram.trim().replace(/^@/, "")}`,
      group: "primary",
    });
  }
  if (fields.behance?.trim()) {
    out.push({
      label: "Behance",
      value: fields.behance.trim(),
      url: guessChannelUrl("Behance", fields.behance),
      group: "social",
    });
  }
  if (fields.dribbble?.trim()) {
    out.push({
      label: "Dribbble",
      value: fields.dribbble.trim(),
      url: guessChannelUrl("Dribbble", fields.dribbble),
      group: "social",
    });
  }
  if (fields.instagram?.trim()) {
    out.push({
      label: "Instagram",
      value: fields.instagram.trim(),
      url: guessChannelUrl("Instagram", fields.instagram),
      group: "social",
    });
  }
  return out;
}

/** Prefer stored channels; if empty/`[]`, hydrate from legacy columns. */
export function resolveContactChannels(
  stored: ContactChannel[] | string | null | undefined,
  legacy: LegacyContactFields
): ContactChannel[] {
  const parsed =
    typeof stored === "string" || stored == null
      ? parseContactChannels(stored)
      : stored.filter((item) => item.label?.trim() && item.value?.trim());
  if (parsed.length > 0) return parsed;
  return channelsFromLegacy(legacy);
}

function channelValue(
  channels: ContactChannel[],
  pattern: RegExp
): string | undefined {
  const value = channels.find((c) => pattern.test(c.label))?.value?.trim();
  return value || undefined;
}

/** Keep legacy columns in sync with channel labels; never blank a field that still has a legacy value when channels are empty. */
export function legacyFieldsFromChannels(
  channels: ContactChannel[],
  fallback: LegacyContactFields = {}
): Required<LegacyContactFields> {
  const resolved = resolveContactChannels(channels, fallback);
  return {
    email: channelValue(resolved, /email|mail/i) ?? fallback.email?.trim() ?? "",
    telegram: channelValue(resolved, /telegram|tg/i) ?? fallback.telegram?.trim() ?? "",
    behance: channelValue(resolved, /behance/i) ?? fallback.behance?.trim() ?? "",
    dribbble: channelValue(resolved, /dribbble/i) ?? fallback.dribbble?.trim() ?? "",
    instagram: channelValue(resolved, /instagram|insta/i) ?? fallback.instagram?.trim() ?? "",
  };
}
