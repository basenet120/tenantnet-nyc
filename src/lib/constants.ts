export const POST_STATUS = ["reported", "acknowledged", "fixed", "unresolved"] as const;

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  reported: { bg: "bg-yellow-100", text: "text-yellow-800" },
  acknowledged: { bg: "bg-green-100", text: "text-green-800" },
  fixed: { bg: "bg-blue-100", text: "text-blue-800" },
  unresolved: { bg: "bg-red-100", text: "text-red-800" },
};

export const IMAGE_LIMITS = {
  maxPerPost: 5,
  maxPerComment: 3,
  maxSizeBytes: 10 * 1024 * 1024, // 10MB
  acceptedTypes: ["image/jpeg", "image/png", "image/webp"],
};

export const SESSION_DURATION_DAYS = 30;
export const COOKIE_NAME = "tn_session";
