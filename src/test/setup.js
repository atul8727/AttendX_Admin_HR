// Ye file har test file se pehle automatically chalti hai (vite.config.js
// ke "setupFiles" me set kiya hai). Yahan jest-dom ke extra matchers
// (jaise toBeInTheDocument, toHaveTextContent) globally available ho jaate hain.
import '@testing-library/jest-dom'
import i18n from '../i18n/index.js'
import { beforeAll } from 'vitest'
beforeAll(() => i18n.changeLanguage('en'))