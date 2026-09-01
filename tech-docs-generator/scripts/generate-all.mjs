import path from 'node:path'
import { rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { canonicalJsonString } from './filesystem.mjs'
import { generateDocs } from './generate.mjs'
import { emitRendererData } from './emit-renderer-data.mjs'
import { buildGeneratorModel } from './model.mjs'
import { validateGeneratedSurface } from './publish-generated-tree.mjs'
import { PARITY_DATA_FILES } from './renderer-data.mjs'
import { writeGuidePages } from './render-repository-guide.mjs'
import { writeRepositoryMap } from './render-repository-map.mjs'
import {
  getDocumentsRoot,
  getGeneratedRoot,
  getRendererDataRoot,
  getStagingGeneratedRoot,
} from './output-contract.mjs'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const defaultRepoRoot = path.resolve(scriptDir, '..', '..')

/**
 * Contract: delete all of `generated-documents/` (and staging leftovers) first,
 * then write fresh. No keep-last-good. Vite cache stays under `results/tooling/tech-docs/`.
 */
export async function wipeDisposableGeneratedOutputs(repoRoot = defaultRepoRoot) {
  const generatedRoot = getGeneratedRoot(repoRoot)
  const stagingRoot = getStagingGeneratedRoot(repoRoot)
  console.log(`generate: delete ${path.relative(repoRoot, generatedRoot) || 'generated-documents'}`)
  await rm(generatedRoot, { recursive: true, force: true })
  await rm(stagingRoot, { recursive: true, force: true })
}

/** Serialize concurrent generateAll in-process (Vite live + overlapping CLI). */
let generateAllQueue = Promise.resolve()

/**
 * Full regen contract:
 * 1. delete `generated-documents/` entirely
 * 2. write fresh docs + data directly (throws on failure → gate fails)
 * 3. validate parity + manifests
 * 4. regenerate repository-graph stats/cycles + page-component graph,
 *    then render the agents-work guide Markdown to its html/ projection
 *    and the repository-map page (deterministic outputs under agents-work/;
 *    the wipe never touches them)
 * (site is rebuilt afterward by `vite build`)
 */
const execFileAsync = promisify(execFile)

async function runRepositoryScript(repoRoot, scriptPath, args) {
  await execFileAsync(process.execPath, [scriptPath, ...args], { cwd: repoRoot })
}

export async function generateAll({ repoRoot = defaultRepoRoot } = {}) {
  const run = async () => {
    await wipeDisposableGeneratedOutputs(repoRoot)
    console.log('generate: write docs + data')
    const model = buildGeneratorModel({ repoRoot })
    const docs = await generateDocs({ repoRoot, model })
    const data = await emitRendererData({ repoRoot, model })
    for (const filename of PARITY_DATA_FILES) {
      const docsValue = docs.jsonOutputs[`data/${filename}`]
      const dataValue = data.payloads[filename]
      if (canonicalJsonString(docsValue) !== canonicalJsonString(dataValue)) {
        throw new Error(`Renderer parity mismatch: ${filename}`)
      }
    }
    await validateGeneratedSurface({ root: getDocumentsRoot(repoRoot), surface: 'docs' })
    await validateGeneratedSurface({ root: getRendererDataRoot(repoRoot), surface: 'data' })
    console.log('generate: repository graph + guide projection')
    await runRepositoryScript(repoRoot, 'tech-docs-generator/scripts/graph-impact.mjs', ['--stats'])
    await runRepositoryScript(repoRoot, 'tech-docs-generator/scripts/graph-impact.mjs', ['--circles'])
    await runRepositoryScript(repoRoot, 'tech-docs-generator/scripts/generate-page-component-graph.mjs', [])
    const guide = writeGuidePages({ repoRoot })
    console.log(`generate: guide projection wrote ${guide.written} files`)
    const map = writeRepositoryMap({ repoRoot })
    console.log(`generate: repository-map projection wrote ${map.written} files`)
    return { model, docs, data, publication: { published: ['docs', 'data'], preserved: [] } }
  }

  const queued = generateAllQueue.then(run, run)
  generateAllQueue = queued.then(
    () => undefined,
    () => undefined,
  )
  return queued
}

const entryPoint = process.argv[1] ? path.resolve(process.argv[1]) : null
if (entryPoint && fileURLToPath(import.meta.url) === entryPoint) {
  generateAll().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
