import { existsSync, readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

const GUIDE_REL = 'agents-work/oando-repository-guide'
const CSS_FILE = 'guide.css'

function slugForName(name) {
  if (name === 'README.md') return 'index.html'
  return name.replace(/^\d+-/, '').replace(/\.md$/, '.html')
}

function collectGuideSources({ repoRoot = defaultRepoRoot } = {}) {
  const guideRoot = path.join(repoRoot, GUIDE_REL)
  const mdDir = path.join(guideRoot, 'markdown')
  const chapters = existsSync(mdDir)
    ? readdirSync(mdDir)
        .filter((name) => name.endsWith('.md'))
        .sort()
        .map((name) => path.join(mdDir, name))
    : []
  const readme = path.join(guideRoot, 'README.md')
  if (!existsSync(readme)) throw new Error(`guide source missing: ${readme}`)
  return { guideRoot, readme, chapters }
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function headingId(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
}

function inlineMarkdown(raw, ctx) {
  const codeSpans = []
  let text = escapeHtml(raw)
  text = text.replace(/`([^`]+)`/g, (_m, code) => {
    codeSpans.push(code)
    return `\u0000${codeSpans.length - 1}\u0000`
  })
  text = text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label, href) => {
    const resolved = ctx.linkFor(href)
    const attrs = resolved.startsWith('http') ? ' target="_blank" rel="noopener noreferrer"' : ''
    return `<a href="${resolved}"${attrs}>${label}</a>`
  })
  text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  text = text.replace(/(^|[^*])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>')
  text = text.replace(/~~([^~]+)~~/g, '<del>$1</del>')
  return text.replace(/\u0000(\d+)\u0000/g, (_m, idx) => `<code>${codeSpans[Number(idx)]}</code>`)
}

function isTableDivider(line) {
  return /^\s*\|?[\s:|-]*-{2,}[\s:|-]*\|?\s*$/.test(line) && line.includes('-')
}

function splitRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim())
}

function markdownToHtml(markdown, ctx) {
  const lines = markdown.replace(/\r\n?/g, '\n').split('\n')
  const out = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    const fence = line.match(/^```(\S*)\s*$/)
    if (fence) {
      const body = []
      i += 1
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        body.push(lines[i])
        i += 1
      }
      i += 1
      const lang = fence[1] ? ` class="language-${fence[1]}"` : ''
      out.push(`<pre><code${lang}>${escapeHtml(body.join('\n'))}\n</code></pre>`)
      continue
    }
    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      const level = heading[1].length
      const id = ` id="${headingId(heading[2].replace(/[`*]/g, ''))}"`
      out.push(`<h${level}${id}>${inlineMarkdown(heading[2], ctx)}</h${level}>`)
      i += 1
      continue
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push('<hr>')
      i += 1
      continue
    }
    if (line.trimStart().startsWith('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) {
      const header = splitRow(line)
      i += 2
      const rows = []
      while (i < lines.length && lines[i].trimStart().startsWith('|')) {
        rows.push(splitRow(lines[i]))
        i += 1
      }
      const thead = header.map((cell) => `<th>${inlineMarkdown(cell, ctx)}</th>`).join('')
      const tbody = rows
        .map((cells) => `<tr>${cells.map((c) => `<td>${inlineMarkdown(c, ctx)}</td>`).join('')}</tr>`)
        .join('\n')
      out.push(`<table>\n<thead><tr>${thead}</tr></thead>\n<tbody>\n${tbody}\n</tbody>\n</table>`)
      continue
    }
    if (/^>\s?/.test(line)) {
      const quote = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quote.push(lines[i].replace(/^>\s?/, ''))
        i += 1
      }
      out.push(`<blockquote>\n${markdownToHtml(quote.join('\n'), ctx).join('\n')}\n</blockquote>`)
      continue
    }
    const item = line.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/)
    if (item) {
      const consumed = renderList(lines, i, item[1].length, ctx)
      out.push(consumed.html)
      i = consumed.next
      continue
    }
    if (!line.trim()) {
      i += 1
      continue
    }
    const para = []
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^```/.test(lines[i]) &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^>\s?/.test(lines[i]) &&
      !/^(\s*)([-*]|\d+\.)\s+/.test(lines[i]) &&
      !(lines[i].trimStart().startsWith('|') && i + 1 < lines.length && isTableDivider(lines[i + 1])) &&
      !/^(-{3,}|\*{3,})\s*$/.test(lines[i])
    ) {
      para.push(lines[i])
      i += 1
    }
    if (para.length) out.push(`<p>${inlineMarkdown(para.join('\n'), ctx)}</p>`)
  }
  return out
}

function renderList(lines, start, indent, ctx) {
  const ordered = /^\s*\d+\./.test(lines[start])
  const items = []
  let i = start
  while (i < lines.length) {
    const match = lines[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/)
    if (!match || match[1].length < indent) break
    if (match[1].length > indent) {
      const nested = renderList(lines, i, match[1].length, ctx)
      if (items.length) items[items.length - 1].children.push(nested.html)
      i = nested.next
      continue
    }
    items.push({ text: match[3], children: [] })
    i += 1
  }
  const tag = ordered ? 'ol' : 'ul'
  const body = items
    .map((item) => {
      const kids = item.children.length ? `\n${item.children.join('\n')}` : ''
      return `<li>${inlineMarkdown(item.text, ctx)}${kids}</li>`
    })
    .join('\n')
  return { html: `<${tag}>\n${body}\n</${tag}>`, next: i }
}

function firstHeading(markdown) {
  const match = markdown.match(/^#\s+(.*)$/m)
  return match ? match[1].replace(/[`*]/g, '') : 'Oando repository guide'
}

function buildLinkResolver({ fromFile, guideRoot, repoRoot }) {
  const known = new Map()
  const sources = collectGuideSources({ repoRoot })
  known.set('README.md', slugForName('README.md'))
  for (const chapter of sources.chapters) known.set(path.basename(chapter), slugForName(path.basename(chapter)))
  const self = slugForName(fromFile)
  return (href) => {
    if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) return href
    const [bare, anchor] = href.split('#')
    const suffix = anchor ? `#${anchor}` : ''
    if (!bare) return href
    const base = path.basename(bare)
    if (bare.endsWith('.md')) {
      if (known.has(base)) {
        const target = known.get(base)
        return target === self ? suffix || `.${path.sep}${target}` : `./${target}${suffix}`
      }
      const outside = path
        .relative(path.join(guideRoot, 'html'), path.resolve(path.join(guideRoot, 'markdown'), bare))
        .replace(/\\/g, '/')
      return `${outside}${suffix}`
    }
    return href
  }
}

function pageShell({ title, bodyHtml, navEntries, active, sourceNote }) {
  const nav = navEntries
    .map(
      (entry) =>
        `<a href="./${entry.href}"${entry.href === active ? ' class="active" aria-current="page"' : ''}>${escapeHtml(entry.label)}</a>`,
    )
    .join('')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="./${CSS_FILE}">
</head>
<body>
<header class="g-header"><a class="g-brand" href="./index.html">Oando repository guide</a>
<nav class="g-nav">${nav}</nav></header>
<main>${bodyHtml}</main>
<footer class="g-footer">${escapeHtml(sourceNote)}</footer>
</body>
</html>
`
}

function guideStyles() {
  return `/* Generated by tech-docs-generator/scripts/render-repository-guide.mjs - do not hand-edit. */
:root { color-scheme: light dark; --ink: #1f2430; --ink-soft: #59606e; --paper: #fbfaf7; --panel: #ffffff; --line: #e3e0d8; --accent: #8a5a2b; }
@media (prefers-color-scheme: dark) { :root { --ink: #e6e2d8; --ink-soft: #a5a094; --paper: #16181c; --panel: #1d2026; --line: #33363d; --accent: #d29a5b; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 15px/1.6 ui-sans-serif, system-ui, sans-serif; }
.g-header { position: sticky; top: 0; background: var(--panel); border-bottom: 1px solid var(--line); padding: 0.6rem 1rem; display: flex; gap: 1rem; align-items: baseline; flex-wrap: wrap; }
.g-brand { font-weight: 700; color: var(--accent); text-decoration: none; }
.g-nav { display: flex; flex-wrap: wrap; gap: 0.2rem 0.8rem; font-size: 0.82rem; }
.g-nav a { color: var(--ink-soft); text-decoration: none; }
.g-nav a.active, .g-nav a:hover { color: var(--accent); }
main { max-width: 62rem; margin: 0 auto; padding: 1.5rem 1.25rem 4rem; }
h1, h2, h3, h4 { line-height: 1.25; margin: 1.6em 0 0.5em; }
h1 { font-size: 1.7rem; margin-top: 0.4em; }
a { color: var(--accent); }
code { background: var(--panel); border: 1px solid var(--line); border-radius: 4px; padding: 0.05em 0.35em; font: 0.85em ui-monospace, monospace; }
pre { background: var(--panel); border: 1px solid var(--line); border-radius: 8px; padding: 0.85rem 1rem; overflow-x: auto; }
pre code { border: 0; background: none; padding: 0; }
table { border-collapse: collapse; margin: 1rem 0; width: 100%; font-size: 0.9rem; }
th, td { border: 1px solid var(--line); padding: 0.4rem 0.6rem; text-align: left; vertical-align: top; }
th { background: var(--panel); }
blockquote { margin: 1rem 0; padding: 0.2rem 0.9rem; border-left: 3px solid var(--accent); color: var(--ink-soft); background: var(--panel); }
hr { border: 0; border-top: 1px solid var(--line); margin: 2rem 0; }
.g-footer { max-width: 62rem; margin: 0 auto; padding: 1rem 1.25rem 3rem; color: var(--ink-soft); font-size: 0.8rem; border-top: 1px solid var(--line); }
`
}

export function renderGuidePages({ repoRoot = defaultRepoRoot } = {}) {
  const sources = collectGuideSources({ repoRoot })
  const entries = []
  const readmeSource = 'README.md'
  const readmeRaw = readFileSync(sources.readme, 'utf8')
  entries.push({ file: sources.readme, name: readmeSource })
  for (const chapter of sources.chapters) entries.push({ file: chapter, name: path.basename(chapter) })
  const navEntries = entries.map((entry) => ({
    href: slugForName(entry.name),
    label: entry.name === readmeSource ? 'Start' : firstHeading(readFileSync(entry.file, 'utf8')),
  }))
  const pages = []
  for (const entry of entries) {
    const raw = readFileSync(entry.file, 'utf8')
    const ctx = { linkFor: buildLinkResolver({ fromFile: entry.name, guideRoot: sources.guideRoot, repoRoot }) }
    const bodyHtml = markdownToHtml(raw, ctx).join('\n')
    const href = slugForName(entry.name)
    const title = `${firstHeading(raw)} - Oando repository guide`
    const sourceNote = `Generated from ${GUIDE_REL}/${entry.name} by render-repository-guide.mjs - edit the Markdown source, not this page.`
    pages.push({ href, html: pageShell({ title, bodyHtml, navEntries, active: href, sourceNote }) })
  }
  pages.push({ href: CSS_FILE, html: guideStyles() })
  return { guideRoot: sources.guideRoot, pages }
}

export function writeGuidePages({ repoRoot = defaultRepoRoot } = {}) {
  const { guideRoot, pages } = renderGuidePages({ repoRoot })
  const outDir = path.join(guideRoot, 'html')
  mkdirSync(outDir, { recursive: true })
  for (const page of pages) writeFileSync(path.join(outDir, page.href), page.html, 'utf8')
  return { written: pages.length, outDir }
}
