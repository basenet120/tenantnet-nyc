import { getLang } from "./get-lang";
import { translateUiStrings, RTL_LANGS } from "./i18n";
import appStrings from "@/i18n/app.en.json";

export type AppStrings = Record<keyof typeof appStrings, string>;

/**
 * Server-side helper: get translated UI strings for the app.
 * Call from any server component, then pass `t` function or strings object to children.
 */
export async function getAppStrings() {
  const lang = await getLang();
  const strings = await translateUiStrings(appStrings, lang, "app");
  const t = (key: keyof typeof appStrings) => strings[key] ?? appStrings[key];
  const dir = RTL_LANGS.includes(lang) ? "rtl" : "ltr";
  return { t, strings: strings as AppStrings, lang, dir };
}
