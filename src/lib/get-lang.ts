import { cookies } from "next/headers";
import { LANG_COOKIE, SUPPORTED_LANGS, type LangCode } from "./i18n";

/**
 * Get current language from cookie (server-side).
 */
export async function getLang(): Promise<LangCode> {
  const cookieStore = await cookies();
  const val = cookieStore.get(LANG_COOKIE)?.value;
  if (val && val in SUPPORTED_LANGS) return val as LangCode;
  return "en";
}
