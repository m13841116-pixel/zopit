// Utility for applying and persisting AI Studio UI/Theme changes without database modifications

export interface AIStudioChanges {
  customCss?: string;
  announcementBanner?: {
    enabled?: boolean;
    text?: string;
    bgColor?: string;
    textColor?: string;
  };
  uiTheme?: {
    primaryColor?: string;
    backgroundColor?: string;
    cardRadius?: string;
    fontScale?: string;
  };
  appliedAt?: string;
  promptSummary?: string;
}

const LOCAL_STORAGE_KEY = "zopit_aistudio_applied_changes";
const DRAFT_STORAGE_KEY = "zopit_aistudio_draft_changes";

export function getAppliedAIStudioChanges(): AIStudioChanges | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Error reading AI Studio changes:", err);
    return null;
  }
}

export function getDraftAIStudioChanges(): AIStudioChanges | null {
  try {
    const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.error("Error reading draft AI Studio changes:", err);
    return null;
  }
}

export function saveDraftAIStudioChanges(changes: AIStudioChanges): void {
  try {
    localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(changes));
    window.dispatchEvent(new CustomEvent("zopit_aistudio_draft_updated", { detail: changes }));
  } catch (err) {
    console.error("Error saving draft AI Studio changes:", err);
  }
}

export function applyAIStudioChanges(changes: AIStudioChanges): void {
  try {
    const timestamped = {
      ...changes,
      appliedAt: new Date().toISOString()
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(timestamped));
    injectCustomStyles(timestamped.customCss || "");
    window.dispatchEvent(new CustomEvent("zopit_aistudio_updated", { detail: timestamped }));
  } catch (err) {
    console.error("Error applying AI Studio changes:", err);
  }
}

export function clearAIStudioChanges(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    injectCustomStyles("");
    window.dispatchEvent(new CustomEvent("zopit_aistudio_updated", { detail: null }));
  } catch (err) {
    console.error("Error clearing AI Studio changes:", err);
  }
}

export function injectCustomStyles(css: string): void {
  if (typeof document === "undefined") return;
  let styleEl = document.getElementById("zopit-aistudio-styles") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "zopit-aistudio-styles";
    document.head.appendChild(styleEl);
  }
  styleEl.textContent = css || "";
}

// Initial setup on module import
if (typeof window !== "undefined") {
  const existing = getAppliedAIStudioChanges();
  if (existing?.customCss) {
    injectCustomStyles(existing.customCss);
  }
}
