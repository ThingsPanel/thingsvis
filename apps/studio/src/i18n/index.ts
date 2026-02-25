import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import zhCommon from './locales/zh/common.json'
import enCommon from './locales/en/common.json'
import zhEditor from './locales/zh/editor.json'
import enEditor from './locales/en/editor.json'
import zhPages from './locales/zh/pages.json'
import enPages from './locales/en/pages.json'

const resources = {
    zh: {
        common: zhCommon,
        editor: zhEditor,
        pages: zhPages,
    },
    en: {
        common: enCommon,
        editor: enEditor,
        pages: enPages,
    },
}

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'zh',
        defaultNS: 'common',
        ns: ['common', 'editor', 'pages'],

        detection: {
            order: ['localStorage', 'navigator'],
            lookupLocalStorage: 'thingsvis-lang',
            caches: ['localStorage'],
        },

        interpolation: {
            escapeValue: false, // React already escapes
        },
    })

export default i18n
