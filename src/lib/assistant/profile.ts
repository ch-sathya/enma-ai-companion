// User profile — local-only, drives the assistant personalization.
export interface AssistantProfile {
  name: string;
  role: string;
  timezone: string;
  workingHours: string;
  commStyle: "concise" | "balanced" | "detailed";
  interests: string[];
  bio: string;
  onboarded: boolean;
}

const KEY = "enma_profile";

export const DEFAULT_PROFILE: AssistantProfile = {
  name: "",
  role: "",
  timezone:
    typeof Intl !== "undefined"
      ? Intl.DateTimeFormat().resolvedOptions().timeZone
      : "UTC",
  workingHours: "9:00 - 18:00",
  commStyle: "balanced",
  interests: [],
  bio: "",
  onboarded: false,
};

export const loadProfile = (): AssistantProfile => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return DEFAULT_PROFILE;
};

export const saveProfile = (p: AssistantProfile) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* ignore */
  }
};
