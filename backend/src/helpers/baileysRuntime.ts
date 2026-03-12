import path from "path";
import fs from "fs";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createRequire }: any = require("module");

type AnyFn = (...args: any[]) => any;

const packageCandidates = ["@itsukichan/baileys", "@whiskeysockets/baileys"];
const subPathCandidates = {
  initAuthCreds: [
    "lib/Utils/auth-utils",
    "lib/Utils/auth-utils.js",
    "lib/Utils/auth-utils.cjs",
    "dist/Utils/auth-utils",
    "dist/Utils/auth-utils.js"
  ],
  makeCacheableSignalKeyStore: [
    "lib/Utils/auth-utils",
    "lib/Utils/auth-utils.js",
    "lib/Utils/signal",
    "lib/Utils/signal.js",
    "lib/Utils/signal.cjs",
    "dist/Utils/signal",
    "dist/Utils/signal.js"
  ]
} as const;

const rootCandidates = Array.from(
  new Set([
    path.resolve(__dirname, "..", ".."),
    path.resolve(__dirname, "..", "..", ".."),
    process.cwd(),
    path.dirname(require?.main?.filename || "")
  ].filter(Boolean))
);

const nodeModulesCandidates = Array.from(
  new Set(rootCandidates.map(root => path.join(root, "node_modules")))
);

const requireContexts: Array<{ label: string; req: (id: string) => any }> = [
  { label: "native", req: require },
  ...rootCandidates
    .map(root => ({ root, packageJson: path.join(root, "package.json") }))
    .filter(({ packageJson }) => fs.existsSync(packageJson))
    .map(({ root, packageJson }) => ({
      label: `createRequire(${root})`,
      req: createRequire(packageJson)
    }))
];

const tryLoad = (id: string): any => {
  for (const ctx of requireContexts) {
    try {
      return ctx.req(id);
    } catch {
      // próximo contexto
    }
  }
  return undefined;
};

const pickFn = (mod: any, name: string): AnyFn | undefined => {
  if (typeof mod?.[name] === "function") return mod[name];
  if (typeof mod?.default?.[name] === "function") return mod.default[name];
  if (typeof mod?.default === "function" && name === "makeWASocket") return mod.default;
  return undefined;
};

const resolveBaileysFn = (name: keyof typeof subPathCandidates): AnyFn | undefined => {
  // 1) pacote raiz
  for (const pkg of packageCandidates) {
    const rootMod = tryLoad(pkg);
    const rootFn = pickFn(rootMod, name);
    if (rootFn) return rootFn;
  }

  // 2) submódulos relativos do pacote
  for (const pkg of packageCandidates) {
    for (const sub of subPathCandidates[name]) {
      const mod = tryLoad(`${pkg}/${sub}`);
      const fn = pickFn(mod, name);
      if (fn) return fn;
    }
  }

  // 3) caminhos absolutos em node_modules
  for (const pkg of packageCandidates) {
    const pkgParts = pkg.split("/");
    for (const nm of nodeModulesCandidates) {
      const rootAbs = tryLoad(path.join(nm, ...pkgParts));
      const rootFn = pickFn(rootAbs, name);
      if (rootFn) return rootFn;

      for (const sub of subPathCandidates[name]) {
        const mod = tryLoad(path.join(nm, ...pkgParts, sub));
        const fn = pickFn(mod, name);
        if (fn) return fn;
      }
    }
  }

  return undefined;
};

export const getInitAuthCreds = (): AnyFn => {
  const fn = resolveBaileysFn("initAuthCreds");
  if (!fn) {
    throw new Error("[BAILEYS] initAuthCreds não encontrado em nenhum módulo conhecido.");
  }
  return fn;
};

export const getMakeCacheableSignalKeyStore = (): AnyFn | undefined =>
  resolveBaileysFn("makeCacheableSignalKeyStore");
