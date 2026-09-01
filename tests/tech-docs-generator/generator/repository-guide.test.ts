import { describe, expect, it } from 'vitest'
import { defaultRepoRoot } from '../helpers/shared-repo-model.mjs'
import { renderGuidePages } from '../../../tech-docs-generator/scripts/render-repository-guide.mjs'

function pageMap(result: { pages: { href: string; html: string }[] }) {
  return new Map(result.pages.map((page) => [page.href, page.html]))
}

describe('render-repository-guide', () => {
  it('renders the README plus every chapter plus the stylesheet', () => {
    const result = renderGuidePages({ repoRoot: defaultRepoRoot })
    const pages = pageMap(result)
    expect(pages.has('index.html')).toBe(true)
    expect(pages.has('guide.css')).toBe(true)
    expect(pages.has('repository-map.html')).toBe(true)
    expect(pages.has('agent-workflows.html')).toBe(true)
    expect(result.pages.length).toBeGreaterThanOrEqual(13)
  })

  it('is deterministic across renders', () => {
    const first = pageMap(renderGuidePages({ repoRoot: defaultRepoRoot }))
    const second = pageMap(renderGuidePages({ repoRoot: defaultRepoRoot }))
    expect([...second.keys()]).toEqual([...first.keys()])
    for (const [name, html] of second) expect(html).toBe(first.get(name))
  })

  it('rewrites chapter Markdown links to sibling HTML and keeps structure blocks', () => {
    const pages = pageMap(renderGuidePages({ repoRoot: defaultRepoRoot }))
    const index = pages.get('index.html') ?? ''
    expect(index).toContain('href="./repository-map.html"')
    expect(index).not.toMatch(/href="[^"]*\.md"/)
    const chapter = pages.get('agent-workflows.html') ?? ''
    expect(chapter).toContain('<table>')
    expect(chapter).toContain('<pre><code')
    expect(chapter).toContain('render-repository-guide.mjs')
  })

  it('emits no wall-clock timestamps in pages or styles', () => {
    const result = renderGuidePages({ repoRoot: defaultRepoRoot })
    for (const page of result.pages) {
      expect(page.html).not.toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)
    }
  })
})
