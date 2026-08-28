import { resolve } from "path";
import { evaluateCapabilities, LOCAL_POWER_PATH } from "../.kiro/kiro-repo-guidance-setup/capabilities.ts";
const repositoryRoot = resolve("./.kiro/kiro-repo-guidance-setup/../../..");
const result = evaluateCapabilities({ repositoryRoot, powerPaths: [LOCAL_POWER_PATH] });
const power = result.output?.powers.find((p) => p.name === "oando-workflow");
console.log("format:", power?.format);
console.log("powerManifestPresent:", power?.powerManifestPresent);
console.log("pluginManifestPresent:", power?.pluginManifestPresent);
console.log("pathOrInstallation:", power?.pathOrInstallation);
