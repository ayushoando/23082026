/**
 * Lane C HookEvaluator.
 *
 * This evaluator is deliberately read-only. It parses only repository-local
 * hook manifests, records the observed state, and returns a fail-closed
 * projection. It never executes a hook, changes a manifest, enables a
 * capability, or contacts an external service.
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";

import {
  REPOSITORY_ROOT,
  type CapabilityDisposition,
  type HookActionType,
  type HookRecord,
  type HookSchemaResult,
  type Identifier,
  type KiroSurface,
  type MaintenanceRisk,
  type RepositoryPath,
  type StageResult,
  type ValidationRun,
} from "./contracts";

export const HOOK_DIRECTORY = ".kiro/hooks" as const;
export const HOOK_SCHEMA_VERSION = "v1" as const;
export const HOOK_TIMEOUT_MIN_SECONDS = 1 as const;
export const HOOK_TIMEOUT_MAX_SECONDS = 120 as const;

export const SUPPORTED_HOOK_EVENTS = [
  "PreToolUse",
  "PostToolUse",
  "SessionStart",
  "Stop",
  "UserPromptSubmit",
  "PreTaskExec",
  "PostTaskExec",
  "PostFileCreate",
  "PostFileSave",
  "PostFileDelete",
] as const;

export const HOOK_SURFACES = [
  "IDE",
  "CLI 2.x",
  "CLI 3.x",
  "Local_Repository_Surface",
] as const satisfies readonly KiroSurface[];

export const FILE_HOOK_EVENTS = [
  "PostFileCreate",
  "PostFileSave",
  "PostFileDelete",
] as const;

const FILE_HOOK_EVENT_SET = new Set<string>(FILE_HOOK_EVENTS);
const SUPPORTED_HOOK_EVENT_SET = new Set<string>(SUPPORTED_HOOK_EVENTS);
const SECRET_PATTERN = /(?:api[_-]?key|token|password|secret)\s*[=:]\s*[^\s"']+/i;
const SECRET_REDACTION_PATTERN = /((?:api[_-]?key|token|password|secret)\s*[=:]\s*)[^\s"']+/gi;
const EXTERNAL_OR_PRODUCTION_PATTERN =
  /\b(?:curl|wget|invoke-webrequest|invoke-restmethod|supabase|vercel|worker:deploy|db:apply|r2:|production)\b|https?:\/\//i;
const UNSAFE_WRITE_PATTERN =
  /(?:^|[;&|])\s*(?:rm|del|erase|remove-item|set-content|out-file)|(?:fs\.(?:write|append)|writefile|write_text|git\s+(?:push|reset)|pnpm\s+install)\b/i;

interface RawHookAction {
  readonly type?: unknown;
  readonly command?: unknown;
  readonly prompt?: unknown;
  readonly timeout?: unknown;
}

interface RawHookDefinition {
  readonly name?: unknown;
  readonly trigger?: unknown;
  readonly matcher?: unknown;
  readonly enabled?: unknown;
  readonly timeout?: unknown;
  readonly action?: unknown;
}

interface RawHookManifest {
  readonly version?: unknown;
  readonly hooks?: unknown;
}

export interface HookEvaluatorInput {
  readonly repositoryRoot?: string;
  readonly hookPaths?: readonly RepositoryPath[];
  readonly owner?: string;
  readonly validationRuns?: readonly ValidationRun[];
  readonly approvedOverlapRefs?: readonly Identifier[];
}

export interface EvaluatedHookRecord extends HookRecord {
  readonly blockers: readonly string[];
  readonly evidence: readonly string[];
  readonly fileHookEvidenceScope?: "agent-made changes only";
  readonly storedCommandSeparator?: "semicolon" | "none";
}

export interface HookEvaluationResult {
  readonly hooks: readonly EvaluatedHookRecord[];
  readonly manifests: readonly RepositoryPath[];
  /** The prior PowerShell && report is not attributed to stored hooks by default. */
  readonly unrelatedPowerShellAndAndError: true;
}

export interface HookEvaluatorContract {
  evaluate(input?: HookEvaluatorInput): StageResult<HookEvaluationResult>;
}

interface ReadManifestResult {
  readonly raw: RawHookManifest | null;
  readonly blocker?: string;
}

interface CommandReview {
  readonly blockers: readonly string[];
  readonly dependencies: readonly string[];
  readonly referencedPaths: readonly string[];
}

interface HookEvaluationDetails {
  readonly record: EvaluatedHookRecord;
  readonly overlapKey: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\//, "").replace(/\/+$/, "");
}

function normalizeRepositoryPath(path: string): RepositoryPath {
  return normalizePath(path) as RepositoryPath;
}

function redactSensitive(value: string): string {
  return value.replace(SECRET_REDACTION_PATTERN, "$1[REDACTED]");
}

function isStandaloneHookPath(path: RepositoryPath): boolean {
  const normalized = normalizePath(path);
  const prefix = `${HOOK_DIRECTORY}/`;
  if (!normalized.startsWith(prefix) || !normalized.endsWith(".json")) return false;
  const relativePath = normalized.slice(prefix.length);
  return relativePath.length > 0 && !relativePath.includes("/");
}

function isInsideRoot(root: string, candidate: string): boolean {
  const relativeCandidate = normalizePath(relative(root, candidate));
  return relativeCandidate === "" || (!relativeCandidate.startsWith("../") && relativeCandidate !== "..");
}

/**
 * Resolve a repository path without allowing lexical or symlink escapes.
 * Non-existent paths remain resolvable so callers can report a precise
 * unavailable-reference blocker rather than an opaque path error.
 */
function resolveInsideRoot(root: string, path: RepositoryPath): string | null {
  const rootAbsolute = resolve(root);
  const candidate = resolve(rootAbsolute, path);
  if (!isInsideRoot(rootAbsolute, candidate)) return null;

  if (existsSync(candidate)) {
    try {
      const realRoot = realpathSync(rootAbsolute);
      const realCandidate = realpathSync(candidate);
      if (!isInsideRoot(realRoot, realCandidate)) return null;
    } catch {
      return null;
    }
  }

  return candidate;
}

function discoverHookPaths(repositoryRoot: string): RepositoryPath[] {
  const hookDirectory = join(repositoryRoot, HOOK_DIRECTORY);
  if (!existsSync(hookDirectory)) return [];

  try {
    return readdirSync(hookDirectory)
      .filter((entry) => entry.endsWith(".json"))
      .filter((entry) => {
        try {
          return statSync(join(hookDirectory, entry)).isFile();
        } catch {
          return false;
        }
      })
      .sort()
      .map((entry) => normalizeRepositoryPath(relative(repositoryRoot, join(hookDirectory, entry))));
  } catch {
    return [];
  }
}

function isPascalCase(value: string): boolean {
  return /^[A-Z][A-Za-z0-9]*$/.test(value);
}

function isSupportedEvent(value: string): boolean {
  return SUPPORTED_HOOK_EVENT_SET.has(value);
}

function readManifest(repositoryRoot: string, path: RepositoryPath): ReadManifestResult {
  if (!isStandaloneHookPath(path)) {
    return { raw: null, blocker: "hook manifests must be standalone .kiro/hooks/*.json files" };
  }

  const absolute = resolveInsideRoot(repositoryRoot, path);
  if (!absolute) {
    return { raw: null, blocker: `hook manifest path escapes repository root: ${path}` };
  }
  if (!existsSync(absolute)) return { raw: null, blocker: `hook manifest is unavailable: ${path}` };

  try {
    if (!statSync(absolute).isFile()) {
      return { raw: null, blocker: `hook manifest is not a file: ${path}` };
    }
    const parsed: unknown = JSON.parse(readFileSync(absolute, "utf8"));
    if (!isRecord(parsed)) {
      return { raw: null, blocker: `hook manifest root must be a JSON object: ${path}` };
    }
    return { raw: parsed as RawHookManifest };
  } catch {
    return { raw: null, blocker: `hook manifest is not valid JSON: ${path}` };
  }
}

function actionRecord(action: unknown): RawHookAction | undefined {
  return isRecord(action) ? (action as RawHookAction) : undefined;
}

function actionType(action: RawHookAction | undefined): HookActionType | null {
  return action?.type === "command" || action?.type === "agent" ? action.type : null;
}

function actionSummary(action: RawHookAction | undefined, type: HookActionType | null): string {
  if (type === "command" && typeof action?.command === "string") return redactSensitive(action.command);
  if (type === "agent" && typeof action?.prompt === "string") return redactSensitive(action.prompt);
  return "unavailable action";
}

function commandUsesJsonStdin(command: string): boolean {
  const readsStdin = /(?:process\.stdin|Console\]::In|ReadToEnd\(\)|\$input|\bstdin\b)/i.test(command);
  const parsesJson = /(?:JSON\.parse|ConvertFrom-Json|json\.loads|fromJson)/i.test(command);
  return readsStdin && parsesJson;
}

/**
 * A matcher is narrow when it contains a concrete path/extension boundary.
 * Bare or global wildcards are rejected; lifecycle agent prompts may omit a
 * matcher because they do not target a file resource.
 */
function matcherIsNarrowTargetOnly(matcher: string): boolean {
  const normalized = matcher.trim();
  if (!normalized || normalized.length > 240 || /[\r\n]/.test(normalized)) return false;
  if (/^(?:\^)?(?:\.\*|\*)\$?$/.test(normalized)) return false;

  const hasPathOrExtension = /(?:[\\/]|\\\.[A-Za-z0-9]+|\.[A-Za-z0-9]{1,12}(?:\$|\b)|\[[^\]]+\]|\([^)]*\))/.test(normalized);
  const hasBoundary = /(?:\^|\$|[\\/]|\\\.)/.test(normalized);
  return hasPathOrExtension && hasBoundary;
}

function stripQuotes(value: string): string {
  return value.replace(/^['"]|['"]$/g, "");
}

function pathLike(value: string): boolean {
  return (
    value.length > 0 &&
    !value.startsWith("-") &&
    !/[()$|;&]/.test(value) &&
    (value.includes("/") || value.includes("\\"))
  );
}

/** Extract local script operands without treating PowerShell -Command text as a path. */
function referencedCommandPaths(command: string): string[] {
  const paths: string[] = [];
  const nodeOrPythonPattern =
    /\b(?:node|python(?:3)?)(?:\.exe)?\s+(?:(?:--?[A-Za-z][\w-]*)(?:\s+))*((?:"[^"]+"|'[^']+'|[^\s;&|]+))/gi;
  for (const match of command.matchAll(nodeOrPythonPattern)) {
    const candidate = stripQuotes(match[1]);
    if (pathLike(candidate)) paths.push(candidate);
  }

  const powershellFilePattern =
    /\b(?:powershell|pwsh)(?:\.exe)?\s+(?:-[A-Za-z][\w-]*\s+)*-File\s+((?:"[^"]+"|'[^']+'|[^\s;&|]+))/gi;
  for (const match of command.matchAll(powershellFilePattern)) {
    const candidate = stripQuotes(match[1]);
    if (pathLike(candidate)) paths.push(candidate);
  }

  return unique(paths);
}

function fileExists(repositoryRoot: string, repositoryPath: string): boolean {
  const absolute = resolveInsideRoot(repositoryRoot, normalizeRepositoryPath(repositoryPath));
  if (!absolute || !existsSync(absolute)) return false;
  try {
    return statSync(absolute).isFile();
  } catch {
    return false;
  }
}

function loadPackageScripts(repositoryRoot: string): Readonly<Record<string, unknown>> {
  const packagePath = join(repositoryRoot, "package.json");
  if (!existsSync(packagePath)) return {};
  try {
    const parsed: unknown = JSON.parse(readFileSync(packagePath, "utf8"));
    if (!isRecord(parsed) || !isRecord(parsed.scripts)) return {};
    return parsed.scripts;
  } catch {
    return {};
  }
}

function reviewedRootCommand(
  command: string,
  packageScripts: Readonly<Record<string, unknown>>,
  repositoryRoot: string,
): CommandReview {
  const blockers: string[] = [];
  const dependencies: string[] = [];
  const referencedPaths = referencedCommandPaths(command).map(normalizeRepositoryPath);
  const scriptMatches = [...command.matchAll(/\bpnpm\s+run\s+([\w:-]+)/g)];

  for (const match of scriptMatches) {
    const script = match[1];
    dependencies.push(`pnpm run ${script}`);
    if (typeof packageScripts[script] !== "string") {
      blockers.push(`reviewed Repository_Command is unavailable: pnpm run ${script}`);
    }
  }

  for (const commandPath of referencedPaths) {
    dependencies.push(commandPath);
    const absolutePath = resolveInsideRoot(repositoryRoot, commandPath);
    if (!absolutePath) {
      blockers.push(`referenced command path escapes repository root: ${commandPath}`);
    } else if (!fileExists(repositoryRoot, commandPath)) {
      blockers.push(`referenced command path is unavailable: ${commandPath}`);
    }
  }

  if (/\b(?:npm|yarn|npx)\b/i.test(command)) blockers.push("hook commands must use root-only pnpm");
  if (/(?:^|[;&|])\s*(?:cd|push-location|set-location)\s+/i.test(command)) {
    blockers.push("hook commands must run from the repository root and may not change working directory");
  }
  if (/\bpnpm\s+(?:--dir|--filter\s+[^\s]+\s+install|install|add|remove)\b/i.test(command)) {
    blockers.push("hook commands must use an existing root Repository_Command and may not install or change dependencies");
  }
  if (scriptMatches.length === 0 && referencedPaths.length === 0) {
    blockers.push("hook command must use an existing Repository_Command or repository-local script");
  }

  return { blockers, dependencies: unique(dependencies), referencedPaths };
}

function schemaResult(blockers: readonly string[], actionTimeoutPresent: boolean): HookSchemaResult {
  if (actionTimeoutPresent) return "Unverified";
  return blockers.length === 0 ? "pass" : "fail";
}

function isDomainFastCheck(path: RepositoryPath): boolean {
  return normalizePath(path).toLowerCase().endsWith("/domain-fast-check.json");
}

function isLtmCapture(path: RepositoryPath, name: string, command: string): boolean {
  return (
    normalizePath(path).toLowerCase().endsWith("/ltm-postturn-capture.json") ||
    /ltm\/?bin\/?ltm\.py\s+capture-turn/i.test(command) ||
    /ltm\s+capture/i.test(name)
  );
}

function dispositionFor(
  enabled: boolean,
  schema: HookSchemaResult,
  blockers: readonly string[],
  path: RepositoryPath,
  name: string,
  ltmCapture = false,
): CapabilityDisposition {
  if (ltmCapture || isLtmCapture(path, name, "")) return "disable";
  if (isDomainFastCheck(path)) return "defer";
  if (schema !== "pass" || blockers.length > 0) return "defer";
  return enabled ? "defer" : "observe";
}

function validationMentionsPath(run: ValidationRun, path: RepositoryPath): boolean {
  const normalizedPath = normalizePath(path).toLowerCase();
  const evidence = [
    run.action,
    run.scope,
    run.commandOrInteraction,
    ...run.evidenceRefs,
  ].join(" ").toLowerCase();
  return evidence.includes(normalizedPath) || evidence.includes(normalizedPath.replaceAll("/", "\\"));
}

function validLocalValidation(run: ValidationRun, path: RepositoryPath): boolean {
  return (
    run.surface === "Local_Repository_Surface" &&
    run.version === "repository" &&
    run.executionLayer === "surface_validation" &&
    run.result === "pass" &&
    run.blocker === "none" &&
    run.unverifiedItems.length === 0 &&
    validationMentionsPath(run, path)
  );
}

function validationRefs(path: RepositoryPath, validationRuns: readonly ValidationRun[]): Identifier[] {
  return unique(
    validationRuns
      .filter((run) => validLocalValidation(run, path) && !/\b(?:pre[- ]change|baseline)\b/i.test(run.action))
      .map((run) => run.validationId),
  );
}

function rollbackValidationRef(path: RepositoryPath, validationRuns: readonly ValidationRun[]): Identifier | undefined {
  return validationRuns.find(
    (run) =>
      validLocalValidation(run, path) &&
      /\b(?:rollback|restore|disable)\b/i.test(`${run.action} ${run.scope} ${run.commandOrInteraction}`),
  )?.validationId;
}

function freshStoredCommandUsesAndAnd(command: string): boolean {
  return command.includes("&&");
}

function commandSideEffectBlockers(command: string): string[] {
  const blockers: string[] = [];
  if (SECRET_PATTERN.test(command)) blockers.push("hook command contains a secret-like value");

  // PowerShell file matchers contain words such as `supabase` and `production`
  // as data. Remove those matcher literals before checking the command's actual
  // side-effecting operations, while retaining URLs and executable invocations.
  const executableText = command.replace(
    /(?:-match|-like|-contains)\s+(?:"(?:\\.|[^"])*"|'(?:\\.|[^'])*')/gi,
    "",
  );
  if (EXTERNAL_OR_PRODUCTION_PATTERN.test(executableText)) {
    blockers.push("hook command has an external or production side effect");
  }
  if (UNSAFE_WRITE_PATTERN.test(command)) {
    blockers.push("hook command has an unrelated or unsafe write side effect");
  }
  return blockers;
}

function evaluateOneHook(
  path: RepositoryPath,
  raw: RawHookDefinition,
  packageScripts: Readonly<Record<string, unknown>>,
  owner: string,
  repositoryRoot: string,
  validationRuns: readonly ValidationRun[],
): HookEvaluationDetails {
  const blockers: string[] = [];
  const trigger = typeof raw.trigger === "string" ? raw.trigger : "";
  const name = typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : `${path}:unnamed-hook`;
  const matcher = typeof raw.matcher === "string" ? raw.matcher : "";
  const observedEnabled = typeof raw.enabled === "boolean" ? raw.enabled : false;
  const action = actionRecord(raw.action);
  const type = actionType(action);
  const summary = actionSummary(action, type);
  const command = type === "command" && typeof action?.command === "string" ? action.command : "";
  const actionTimeoutPresent = action?.timeout !== undefined;
  const hookTimeout = raw.timeout;
  const domainFastCheck = isDomainFastCheck(path);
  const ltmCapture = isLtmCapture(path, name, command);
  const potentiallyEnabled = observedEnabled && !domainFastCheck && !ltmCapture;

  if (!isPascalCase(trigger) || !isSupportedEvent(trigger)) {
    blockers.push("hook trigger must be a supported PascalCase event");
  }
  if (typeof raw.enabled !== "boolean") blockers.push("hook-level enabled must be a boolean");
  if (!type) blockers.push("hook action must be command or agent");
  if (actionTimeoutPresent) blockers.push("timeout must be placed at hook level, not inside action");
  if (hookTimeout === undefined) {
    blockers.push("hook-level timeout is required");
  } else if (
    typeof hookTimeout !== "number" ||
    !Number.isInteger(hookTimeout) ||
    hookTimeout < HOOK_TIMEOUT_MIN_SECONDS ||
    hookTimeout > HOOK_TIMEOUT_MAX_SECONDS
  ) {
    blockers.push(
      `hook-level timeout must be an integer from ${HOOK_TIMEOUT_MIN_SECONDS} through ${HOOK_TIMEOUT_MAX_SECONDS} seconds`,
    );
  }

  const isFileHook = FILE_HOOK_EVENT_SET.has(trigger);
  if (isFileHook && !matcherIsNarrowTargetOnly(matcher)) {
    blockers.push("file hooks require a narrow target-only matcher");
  } else if (!isFileHook && matcher && !matcherIsNarrowTargetOnly(matcher)) {
    blockers.push("hook matcher is not narrow and target-only");
  }
  if (type === "command" && !matcherIsNarrowTargetOnly(matcher)) {
    blockers.push("command hooks require a narrow target-only matcher");
  }

  const commandReview: CommandReview = type === "command" && command.trim()
    ? reviewedRootCommand(command, packageScripts, repositoryRoot)
    : { blockers: [], dependencies: [], referencedPaths: [] };
  if (type === "command") {
    if (!command.trim()) {
      blockers.push("command action requires a command");
    } else {
      blockers.push(...commandReview.blockers);
      if (!commandUsesJsonStdin(command)) blockers.push("command action must consume hook JSON from stdin");
      blockers.push(...commandSideEffectBlockers(command));
    }
  }
  if (type === "agent" && (typeof action?.prompt !== "string" || !action.prompt.trim())) {
    blockers.push("agent action requires a prompt");
  }

  if (ltmCapture) {
    blockers.push("LTM capture depends on a documented stub and must remain disabled");
  }
  if (domainFastCheck) {
    blockers.push("domain-fast-check remains disabled until schema repair and fresh validation pass");
  }

  const recordSchemaResult = schemaResult(blockers, actionTimeoutPresent);
  const pathValidationRefs = validationRefs(path, validationRuns);
  const rollbackRef = rollbackValidationRef(path, validationRuns);
  if (potentiallyEnabled && pathValidationRefs.length === 0) {
    blockers.push("enabled hook requires a fresh passing Local_Repository_Surface validation");
  }
  if (potentiallyEnabled && !rollbackRef) {
    blockers.push("enabled hook requires a fresh rollback-path validation");
  }
  const effectiveEnabled = potentiallyEnabled && blockers.length === 0;

  const semicolon = command.includes(";") ? "semicolon" : "none";
  const commandEvidence = freshStoredCommandUsesAndAnd(command)
    ? "fresh stored-command evidence identifies PowerShell && in the stored command"
    : "a PowerShell && error is unrelated unless the exact stored command contains &&";
  const evidence = unique([
    `observed:${path}`,
    semicolon === "semicolon" ? "stored command uses semicolon separators" : "no stored semicolon separator observed",
    commandEvidence,
  ]);
  if (ltmCapture) evidence.push("LTM capture command is the documented stub and remains disabled");
  if (domainFastCheck) evidence.push("domain-fast-check action-level timeout placement is Unverified");

  const dependencies = unique(commandReview.dependencies);
  const expectedSideEffects = type === "command"
    ? ["bounded repository-local command evaluation"]
    : ["agent guidance only"];

  const record: EvaluatedHookRecord = {
    path,
    name,
    hookEvent: trigger,
    matcher,
    actionType: type ?? "agent",
    enabled: effectiveEnabled,
    ...(typeof hookTimeout === "number" ? { hookLevelTimeoutSeconds: hookTimeout } : {}),
    schemaResult: recordSchemaResult,
    commandOrPromptSummary: summary,
    commandInputContract: type === "command" ? "JSON on stdin required" : "agent prompt action; JSON stdin not applicable",
    dependencies,
    surfaceAvailability: HOOK_SURFACES,
    overlapRefs: [],
    owner,
    maintenanceRisk: (recordSchemaResult === "pass" && blockers.length === 0 ? "medium" : "high") as MaintenanceRisk,
    disposition: dispositionFor(effectiveEnabled, recordSchemaResult, blockers, path, name, ltmCapture),
    preChangeSnapshotRef: `snapshot:${path}`,
    validationRunRefs: pathValidationRefs,
    ...(rollbackRef ? { rollbackValidationRef: rollbackRef } : {}),
    disableAction: `set enabled: false in ${path} and restore snapshot:${path}`,
    expectedSideEffects,
    rollbackPath: `disable ${name} and restore the original bytes from snapshot:${path}`,
    blockers: unique([...commandReview.blockers, ...blockers]),
    evidence,
    ...(isFileHook ? { fileHookEvidenceScope: "agent-made changes only" as const } : {}),
    ...(type === "command" ? { storedCommandSeparator: semicolon as "semicolon" | "none" } : {}),
  };

  return {
    record,
    overlapKey: `${trigger}\u0000${matcher}`,
  };
}

function matcherExtensions(matcher: string): Set<string> {
  const extensions = new Set<string>();
  for (const match of matcher.matchAll(/(?:\\\.|\.)\(?([A-Za-z0-9]{1,12})/g)) {
    extensions.add(match[1].toLowerCase());
  }
  return extensions;
}

function matchersMayOverlap(left: string, right: string): boolean {
  if (!left || !right) return true;
  if (left === right) return true;
  const leftExtensions = matcherExtensions(left);
  const rightExtensions = matcherExtensions(right);
  if (leftExtensions.size > 0 && rightExtensions.size > 0) {
    const shareExtension = [...leftExtensions].some((extension) => rightExtensions.has(extension));
    if (!shareExtension) return false;
  }
  return true;
}

function hooksOverlap(left: EvaluatedHookRecord, right: EvaluatedHookRecord): boolean {
  return (
    left.enabled &&
    right.enabled &&
    left.hookEvent === right.hookEvent &&
    matchersMayOverlap(left.matcher, right.matcher)
  );
}

function withOverlapRefs(
  records: readonly EvaluatedHookRecord[],
  approvedOverlapRefs: readonly Identifier[],
): { records: EvaluatedHookRecord[]; blockers: string[] } {
  const output = records.map((record) => ({ ...record, overlapRefs: [] as string[] }));
  const blockers: string[] = [];

  for (let index = 0; index < output.length; index += 1) {
    for (let otherIndex = index + 1; otherIndex < output.length; otherIndex += 1) {
      const left = output[index];
      const right = output[otherIndex];
      if (!hooksOverlap(left, right)) continue;

      const overlapRef = `overlap:${left.path}:${right.path}`;
      left.overlapRefs.push(overlapRef);
      right.overlapRefs.push(overlapRef);
      if (!approvedOverlapRefs.includes(overlapRef)) {
        blockers.push(
          `${overlapRef} requires distinct purpose, order independence, measured combined runtime, and owner approval`,
        );
      }
    }
  }

  return { records: output, blockers };
}

function evaluateManifestHook(
  path: RepositoryPath,
  raw: RawHookDefinition,
  packageScripts: Readonly<Record<string, unknown>>,
  owner: string,
  repositoryRoot: string,
  validationRuns: readonly ValidationRun[],
): EvaluatedHookRecord {
  const details = evaluateOneHook(path, raw, packageScripts, owner, repositoryRoot, validationRuns);
  return details.record;
}

export function evaluateHooks(input: HookEvaluatorInput = {}): StageResult<HookEvaluationResult> {
  const repositoryRoot = resolve(input.repositoryRoot ?? REPOSITORY_ROOT);
  const owner = input.owner?.trim() || "repository owner";
  const paths = (input.hookPaths ?? discoverHookPaths(repositoryRoot)).map(normalizeRepositoryPath);
  const packageScripts = loadPackageScripts(repositoryRoot);
  const validationRuns = input.validationRuns ?? [];
  const records: EvaluatedHookRecord[] = [];
  const blockers: string[] = [];

  for (const path of paths) {
    const manifest = readManifest(repositoryRoot, path);
    if (!manifest.raw) {
      blockers.push(manifest.blocker ?? `unable to inspect ${path}`);
      continue;
    }
    if (manifest.raw.version !== HOOK_SCHEMA_VERSION) {
      blockers.push(`${path} must declare version ${HOOK_SCHEMA_VERSION}`);
      continue;
    }
    if (!Array.isArray(manifest.raw.hooks) || manifest.raw.hooks.length === 0) {
      blockers.push(`${path} must declare at least one hook definition`);
      continue;
    }

    for (const rawHook of manifest.raw.hooks) {
      if (!isRecord(rawHook)) {
        blockers.push(`${path} contains a non-object hook definition`);
        continue;
      }
      records.push(
        evaluateManifestHook(
          path,
          rawHook as RawHookDefinition,
          packageScripts,
          owner,
          repositoryRoot,
          validationRuns,
        ),
      );
    }
  }

  const overlapResult = withOverlapRefs(records, input.approvedOverlapRefs ?? []);
  const allRecords = overlapResult.records;
  const recordBlockers = allRecords.flatMap((record) =>
    record.blockers.map((blocker) => `${record.path}: ${blocker}`),
  );
  const allBlockers = unique([...blockers, ...recordBlockers, ...overlapResult.blockers]);
  const output: HookEvaluationResult = {
    hooks: allRecords,
    manifests: paths,
    unrelatedPowerShellAndAndError: true,
  };
  if (allBlockers.length === 0) {
    return {
      status: "pass",
      output,
      blockers: [],
      evidenceRefs: allRecords.map((record) => `observed:${record.path}`),
    };
  }
  return {
    status: allRecords.length > 0 ? "partial" : "blocked",
    output,
    blockers: allBlockers,
    evidenceRefs: allRecords.map((record) => `observed:${record.path}`),
  };
}

export class HookEvaluator implements HookEvaluatorContract {
  evaluate(input: HookEvaluatorInput = {}): StageResult<HookEvaluationResult> {
    return evaluateHooks(input);
  }
}

export const hookEvaluator = new HookEvaluator();
export default hookEvaluator;
