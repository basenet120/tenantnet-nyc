import { getLang } from "./get-lang";
import { translateUiStrings } from "./i18n";
import adminStrings from "@/i18n/admin.en.json";

export type AdminStrings = Record<keyof typeof adminStrings, string>;

export async function getAdminStrings() {
  const lang = await getLang();
  const strings = await translateUiStrings(adminStrings, lang, "admin");
  const t = (key: keyof typeof adminStrings) => strings[key] ?? adminStrings[key];
  return { t, strings: strings as AdminStrings, lang };
}
