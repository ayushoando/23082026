import path from 'node:path'
import { rm } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { canonicalJsonString } from './filesystem.mjs'
import { generateDocs } from './generate.mjs'
import { emitRendererData } from './emit-renderer-data.mjs'
import { buildGeneratorModel } from './model.mjs'
import { validateGeneratedSurface } from './publish-generated-tree.mjs'
import { PARITY_DATA_FILES } from './renderer-data.mjs'
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
 * 4. regenerate repository-graph stats/cycles + page-component graph into
 *    generated-documents/repository-graph (inside the wiped root),
 *    wipe and rewrite blast-radius reports for the top fan-in files,
 *    then render the repository-map page (deterministic output under
 *    agents-work/repository-map/)
 * (site is rebuilt afterward by `vite build`)
 */
const execFileAsync = promisify(execFile)

async function runRepositoryScript(repoRoot, scriptPath, args) {
  await execFileAsync(process.execPath, [scriptPath, ...args], { cwd: repoRoot })
}

const IMPACT_SEED_COUNT = 5

/**
 * Impact seeds are the highest fan-in files from the fresh stats report, so the
 * blast-radius reports always target the files with the widest reach. Returns
 * repository-relative paths in stats order (highest count first).
 */
export function readImpactSeeds(statsPath) {
  if (!existsSync(statsPath)) return []
  const stats = JSON.parse(readFileSync(statsPath, 'utf8'))
  return (stats.highestFanIn ?? []).slice(0, IMPACT_SEED_COUNT).map((entry) => entry.file)
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
    console.log('generate: repository graph + map projection')
    await runRepositoryScript(repoRoot, 'tech-docs-generator/scripts/graph-impact.mjs', ['--stats'])
    await runRepositoryScript(repoRoot, 'tech-docs-generator/scripts/graph-impact.mjs', ['--circles'])
    await runRepositoryScript(repoRoot, 'tech-docs-generator/scripts/generate-page-component-graph.mjs', [])
    const graphRoot = path.join(repoRoot, 'generated-documents', 'repository-graph')
    const impactSeeds = readImpactSeeds(path.join(graphRoot, 'stats', 'latest.json'))
    await rm(path.join(graphRoot, 'impact'), { recursive: true, force: true })
    for (const seed of impactSeeds) {
      await runRepositoryScript(repoRoot, 'tech-docs-generator/scripts/graph-impact.mjs', [`--file=${seed}`])
    }
    console.log(`generate: impact reports wrote ${impactSeeds.length} seed files`)
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
