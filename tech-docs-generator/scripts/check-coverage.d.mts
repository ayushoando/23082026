export type CoverageMetric = {
  pct: number
  total?: number
  covered?: number
  skipped?: number
}

export type CoverageSummary = {
  lines: CoverageMetric
  branches: CoverageMetric
  statements: CoverageMetric
  functions: CoverageMetric
}

export type FileCoverage = {
  file: string
  lines: CoverageMetric
}

export type CoverageEvaluation = {
  failures: string[]
  warnings: string[]
  linesPct: number
  branchesPct: number
  statementsPct: number
  functionsPct: number
}

export function evaluateCoverage(
  summary: CoverageSummary,
  pageSummaries?: FileCoverage[],
  sliceSummaries?: FileCoverage[],
): CoverageEvaluation

export function loadCoverageSummary(options?: {
  root?: string
}): {
  summary: CoverageSummary
  pageSummaries: FileCoverage[]
  sliceSummaries: FileCoverage[]
}
