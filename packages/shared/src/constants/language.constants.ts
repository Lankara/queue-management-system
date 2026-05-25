import { LanguageCode } from '../enums/language-code.enum';

export const SUPPORTED_LANGUAGES = [LanguageCode.EN, LanguageCode.SI] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];