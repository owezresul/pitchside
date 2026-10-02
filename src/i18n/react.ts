import { useMemo } from 'react';
import { useStore } from '../store';
import { localizeLabel, translate, type Key, type Lang, type Params } from './dict';

export interface I18n {
  lang: Lang;
  /** Translate a UI string. */
  t: (key: Key, params?: Params) => string;
  /** Translate an engine label such as "Quarter-final 2". */
  L: (label: string) => string;
}

const make = (lang: Lang): I18n => ({
  lang,
  t: (key, params) => translate(lang, key, params),
  L: (label) => localizeLabel(lang, label),
});

/** For components: re-renders when the language changes. */
export function useI18n(): I18n {
  const lang = useStore((s) => s.lang);
  return useMemo(() => make(lang), [lang]);
}

/** For plain functions such as the share-image renderers. */
export const getI18n = (): I18n => make(useStore.getState().lang);
