import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../src/i18n/locales/', import.meta.url))
const BASE = 'en'
const PLURAL = /_(zero|one|two|few|many|other)$/
const flatten = (object, prefix = '') => Object.entries(object).reduce((all, [key, value]) => {
  if (value && typeof value === 'object') Object.assign(all, flatten(value, `${prefix}${key}.`))
  else all[`${prefix}${key}`.replace(PLURAL, '')] = value
  return all
}, {})
const load = (language, file) => JSON.parse(readFileSync(join(ROOT, language, file), 'utf8'))
const placeholders = (value) => [...String(value).matchAll(/{{\s*([^}\s]+)\s*}}/g)].map((match) => match[1]).sort().join(',')
const files = readdirSync(join(ROOT, BASE)).filter((file) => file.endsWith('.json'))
const languages = readdirSync(ROOT, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name !== BASE).map((entry) => entry.name)
let problems = 0
for (const language of languages) for (const file of files) {
  const path = join(ROOT, language, file)
  if (!existsSync(path)) { console.error(`✗ [${language}] missing namespace: ${file}`); problems++; continue }
  const base = flatten(load(BASE, file)); const other = flatten(load(language, file))
  for (const key of Object.keys(base)) {
    if (!(key in other)) { console.error(`✗ [${language}/${file}] missing: ${key}`); problems++ }
    else if (typeof other[key] === 'string' && !other[key].trim()) { console.error(`✗ [${language}/${file}] empty: ${key}`); problems++ }
    else if (placeholders(base[key]) !== placeholders(other[key])) { console.error(`✗ [${language}/${file}] placeholders differ: ${key}`); problems++ }
  }
  for (const key of Object.keys(other)) if (!(key in base)) { console.error(`✗ [${language}/${file}] not in en: ${key}`); problems++ }
}
if (problems) { console.error(`\n${problems} locale issue(s).`); process.exit(1) }
console.log(`✓ All ${languages.length} language(s) match en (${files.length} namespaces).`)
