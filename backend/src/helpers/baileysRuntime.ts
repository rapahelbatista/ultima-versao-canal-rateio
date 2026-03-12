import path from "path";
import fs from "fs";
import { randomBytes, randomUUID } from "crypto";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createRequire }: any = require("module");

type AnyFn = (...args: any[]) => any;

const packageCandidates = ["@itsukichan/baileys", "@whiskeysockets/baileys"];
const subPathCandidates = {
  makeWASocket: [
    "lib/index",
    "lib/index.js",
    "lib/index.cjs",
    "lib/index.mjs",
    "dist/index",
    "dist/index.js",
    "dist/index.cjs",
    "dist/index.mjs"
  ],
  initAuthCreds: [
    "lib/Utils/auth-utils",
    "lib/Utils/auth-utils.js",
    "lib/Utils/auth-utils.cjs",
    "lib/Utils/auth-utils.mjs",
    "dist/Utils/auth-utils",
    "dist/Utils/auth-utils.js",
    "dist/Utils/auth-utils.mjs"
  ],
  makeCacheableSignalKeyStore: [
    "lib/Utils/auth-utils",
    "lib/Utils/auth-utils.js",
    "lib/Utils/signal",
    "lib/Utils/signal.js",
    "lib/Utils/signal.cjs",
    "lib/Utils/signal.mjs",
    "dist/Utils/signal",
    "dist/Utils/signal.js",
    "dist/Utils/signal.mjs"
  ],
  cryptoUtils: [
    "lib/Utils/crypto",
    "lib/Utils/crypto.js",
    "lib/Utils/crypto.cjs",
    "lib/Utils/crypto.mjs",
    "dist/Utils/crypto",
    "dist/Utils/crypto.js",
    "dist/Utils/crypto.mjs"
  ],
  genericsUtils: [
    "lib/Utils/generics",
    "lib/Utils/generics.js",
    "lib/Utils/generics.cjs",
    "lib/Utils/generics.mjs",
    "dist/Utils/generics",
    "dist/Utils/generics.js",
    "dist/Utils/generics.mjs"
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
  if (typeof mod?.default?.default?.[name] === "function") return mod.default.default[name];

  if (name === "makeWASocket") {
    const queue: Array<{ value: any; depth: number }> = [{ value: mod, depth: 0 }];
    const visited = new Set<any>();
    const MAX_DEPTH = 8;

    while (queue.length > 0) {
      const { value, depth } = queue.shift()!;
      if (!value || depth > MAX_DEPTH || visited.has(value)) continue;
      visited.add(value);

      if (typeof value === "function") return value;
      if (typeof value !== "object") continue;

      if (typeof value.makeWASocket === "function") return value.makeWASocket;
      if (typeof value.makeWaSocket === "function") return value.makeWaSocket;

      queue.push(
        { value: value.makeWASocket, depth: depth + 1 },
        { value: value.makeWaSocket, depth: depth + 1 },
        { value: value.default, depth: depth + 1 }
      );
    }
  }

  return undefined;
};

const resolveBaileysFn = (name: "makeWASocket" | "initAuthCreds" | "makeCacheableSignalKeyStore"): AnyFn | undefined => {
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

const resolveUtilityModule = (kind: "cryptoUtils" | "genericsUtils"): any => {
  for (const pkg of packageCandidates) {
    for (const sub of subPathCandidates[kind]) {
      const mod = tryLoad(`${pkg}/${sub}`);
      if (mod) return mod;
    }
  }

  for (const pkg of packageCandidates) {
    const pkgParts = pkg.split("/");
    for (const nm of nodeModulesCandidates) {
      for (const sub of subPathCandidates[kind]) {
        const mod = tryLoad(path.join(nm, ...pkgParts, sub));
        if (mod) return mod;
      }
    }
  }

  return undefined;
};

const synthInitAuthCreds = () => {
  const cryptoUtils = resolveUtilityModule("cryptoUtils");
  const genericsUtils = resolveUtilityModule("genericsUtils");

  const Curve = cryptoUtils?.Curve;
  const signedKeyPair = cryptoUtils?.signedKeyPair;
  const generateRegistrationId = genericsUtils?.generateRegistrationId;

  const createCurvePair = () => {
    if (typeof Curve?.generateKeyPair === "function") {
      return Curve.generateKeyPair();
    }

    return {
      private: randomBytes(32),
      public: randomBytes(32)
    };
  };

  const identityKey = createCurvePair();
  const signedPreKey = typeof signedKeyPair === "function"
    ? signedKeyPair(identityKey, 1)
    : {
      keyPair: createCurvePair(),
      signature: randomBytes(64),
      keyId: 1
    };

  const registrationId = typeof generateRegistrationId === "function"
    ? generateRegistrationId()
    : Math.floor(Math.random() * 16380) + 1;

  return {
    noiseKey: createCurvePair(),
    pairingEphemeralKeyPair: createCurvePair(),
    signedIdentityKey: identityKey,
    signedPreKey,
    registrationId,
    advSecretKey: randomBytes(32).toString("base64"),
    processedHistoryMessages: [],
    nextPreKeyId: 1,
    firstUnuploadedPreKeyId: 1,
    accountSyncCounter: 0,
    accountSettings: { unarchiveChats: false },
    deviceId: Buffer.from(randomUUID().replace(/-/g, ""), "hex").toString("base64url"),
    phoneId: randomUUID(),
    identityId: randomBytes(20),
    registered: false,
    backupToken: randomBytes(20),
    registration: {},
    pairingCode: undefined,
    lastPropHash: undefined,
    routingInfo: undefined
  };
};

export const getMakeWASocket = (): AnyFn | undefined =>
  resolveBaileysFn("makeWASocket");

export const getInitAuthCreds = (): AnyFn =>
  resolveBaileysFn("initAuthCreds") ?? synthInitAuthCreds;

export const getMakeCacheableSignalKeyStore = (): AnyFn | undefined =>
  resolveBaileysFn("makeCacheableSignalKeyStore");
