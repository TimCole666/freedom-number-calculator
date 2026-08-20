export type AnalyticsData = Record<string, string | number | boolean>;

export type Analytics = {
  enabled: boolean;
  track: (name: string, data?: AnalyticsData) => void;
};

type UmamiTracker = {
  track: (name: string, data?: AnalyticsData) => void;
};

type UmamiWindow = Window & { umami?: UmamiTracker };

export type AnalyticsConfig = {
  websiteId?: string;
  scriptUrl?: string;
  target?: UmamiWindow;
  document?: Document;
};

const DEFAULT_SCRIPT_URL = "https://cloud.umami.is/script.js";

export function createAnalytics(config: AnalyticsConfig): Analytics {
  const websiteId = config.websiteId?.trim();
  if (!websiteId) return { enabled: false, track: () => undefined };

  const target = config.target ?? (window as UmamiWindow);
  const doc = config.document ?? document;
  const pending: Array<{ name: string; data?: AnalyticsData }> = [];

  const send = (name: string, data?: AnalyticsData): boolean => {
    if (!target.umami) return false;
    try {
      target.umami.track(name, data);
      return true;
    } catch {
      return false;
    }
  };

  const flush = (): void => {
    while (pending.length > 0 && target.umami) {
      const event = pending.shift();
      if (event) send(event.name, event.data);
    }
  };

  const script = doc.createElement("script");
  script.defer = true;
  script.src = config.scriptUrl?.trim() || DEFAULT_SCRIPT_URL;
  script.dataset.websiteId = websiteId;
  script.dataset.autoTrack = "false";
  script.dataset.excludeSearch = "true";
  script.dataset.doNotTrack = "true";
  script.addEventListener("load", flush, { once: true });
  script.addEventListener("error", () => pending.splice(0, pending.length), { once: true });
  doc.head.append(script);

  return {
    enabled: true,
    track: (name, data) => {
      if (!send(name, data)) pending.push({ name, data });
    },
  };
}
