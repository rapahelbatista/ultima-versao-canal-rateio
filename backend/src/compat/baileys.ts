/**
 * Compatibility shim: exposes `@itsukichan/baileys` using the old
 * `@whiskeysockets/baileys` import shape used across this codebase.
 *
 * Why explicit exports?
 * - The fork is shipped as CommonJS and some TS setups can lose named exports.
 * - We export the symbols used by this repo as `any` to keep compilation stable
 *   across Baileys forks.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path: any = require("path");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs: any = require("fs");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { createRequire }: any = require("module");

// Tenta carregar o Baileys de formas diferentes dependendo do ambiente.
// - Preferimos o fork `@itsukichan/baileys` (compatível com interactiveButtons/nativeFlow usados no projeto)
// - Se não existir, usamos `@whiskeysockets/baileys` como fallback.
// - Caminhos absolutos evitam cair no moduleAlias em cenários específicos.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const requireErrors: string[] = [];

const tryRequire = (
  reqFn: (id: string) => any,
  contextLabel: string,
  id: string,
  collectError = true
) => {
  try {
    return reqFn(id);
  } catch (error: any) {
    if (collectError) {
      const code = error?.code ?? "ERR";
      const message = String(error?.message ?? error);
      requireErrors.push(`[${contextLabel}] ${id} -> ${code}: ${message}`);
    }
    return undefined;
  }
};

const backendRootCandidates = Array.from(
  new Set([
    // Runtime compilado: dist/compat -> backend
    path.resolve(__dirname, "..", ".."),
    // Runtime ts-node: src/compat -> backend
    path.resolve(__dirname, "..", "..", ".."),
    // PM2 / scripts externos
    process.cwd(),
    path.dirname(require?.main?.filename || ""),
  ].filter(Boolean))
);

const backendNodeModulesCandidates = Array.from(
  new Set(backendRootCandidates.map((root) => path.join(root, "node_modules")))
);

const requireContexts: Array<{ label: string; reqFn: (id: string) => any }> = [
  { label: "native-require", reqFn: require },
  ...backendRootCandidates
    .map((root) => ({ root, packageJsonPath: path.join(root, "package.json") }))
    .filter(({ packageJsonPath }) => fs.existsSync(packageJsonPath))
    .map(({ root, packageJsonPath }) => ({
      label: `createRequire(${root})`,
      reqFn: createRequire(packageJsonPath),
    })),
];

const packageCandidates = ["@itsukichan/baileys", "@whiskeysockets/baileys"];
const entrypointCandidates = [
  "lib/index.cjs",
  "dist/index.cjs",
  "lib/index.js",
  "dist/index.js",
];

const moduleCandidates = Array.from(
  new Set([
    ...packageCandidates,
    ...packageCandidates.flatMap((pkg) =>
      backendNodeModulesCandidates.map((nm) => path.join(nm, ...pkg.split("/")))
    ),
    ...packageCandidates.flatMap((pkg) =>
      entrypointCandidates.map((entry) => `${pkg}/${entry}`)
    ),
    ...packageCandidates.flatMap((pkg) =>
      backendNodeModulesCandidates.flatMap((nm) =>
        entrypointCandidates.map((entry) => path.join(nm, ...pkg.split("/"), entry))
      )
    ),
  ])
);

let baileys: any;

for (const context of requireContexts) {
  for (const candidate of moduleCandidates) {
    const loadedModule = tryRequire(context.reqFn, context.label, candidate);
    if (loadedModule) {
      baileys = loadedModule;
      break;
    }
  }
  if (baileys) break;
}

if (!baileys) {
  const debugInfo = requireErrors.slice(0, 10).join("\n") || "Sem detalhes de erro capturados.";
  throw new Error(
    `Baileys não encontrado. Instale @itsukichan/baileys (recomendado) ou @whiskeysockets/baileys no backend.\nTentativas:\n${debugInfo}`
  );
}

// Default export (makeWASocket in most Baileys forks)
const defaultExport: any = baileys?.default ?? baileys;
export default defaultExport;

// Helper: resolve uma função a partir do módulo principal OU de sub-módulos conhecidos
const _resolve = (name: string, ...subModulePaths: string[]): any => {
  // 1. Tenta direto no módulo carregado
  if (typeof baileys[name] === "function" || (baileys[name] != null && typeof baileys[name] === "object")) {
    return baileys[name];
  }
  // 2. Tenta no default export
  if (typeof defaultExport?.[name] === "function" || (defaultExport?.[name] != null && typeof defaultExport?.[name] === "object")) {
    return defaultExport[name];
  }
  // 3. Tenta em sub-módulos
  for (const subPath of subModulePaths) {
    for (const pkg of packageCandidates) {
      for (const context of requireContexts) {
        const mod = tryRequire(context.reqFn, `${context.label}::${name}`, `${pkg}/${subPath}`, false);
        if (mod?.[name]) return mod[name];
        if (mod?.default?.[name]) return mod.default[name];
      }
    }
  }
  return undefined;
};

// --- Core runtime exports ---
export const makeWASocket: any = _resolve("makeWASocket") ?? defaultExport;

// proto needs to work both as a value AND as a namespace (proto.IWebMessageInfo etc.)
export const proto: any = _resolve("proto");
// Declare proto as a namespace so `proto.X` type references compile
export declare namespace proto {
  type IWebMessageInfo = any;
  type WebMessageInfo = any;
  type IUserReceipt = any;
  type Message = any;
  namespace Message {
    type AppStateSyncKeyData = any;
  }
}

export const initAuthCreds: any = _resolve("initAuthCreds", "lib/Utils/auth-utils", "lib/Utils/auth-utils.js");
export const makeCacheableSignalKeyStore: any = _resolve("makeCacheableSignalKeyStore", "lib/Utils/signal", "lib/Utils/signal.js", "lib/Utils/auth-utils", "lib/Utils/auth-utils.js");

export const delay: any = baileys.delay;
export const generateWAMessageFromContent: any = baileys.generateWAMessageFromContent;
export const downloadMediaMessage: any = baileys.downloadMediaMessage;
export const extractMessageContent: any = baileys.extractMessageContent;
export const getContentType: any = baileys.getContentType;

export const jidNormalizedUser: any = baileys.jidNormalizedUser;
export const isJidBroadcast: any = baileys.isJidBroadcast;
export const isJidGroup: any = baileys.isJidGroup;
export const isJidStatusBroadcast: any = baileys.isJidStatusBroadcast;

export const Browsers: any = baileys.Browsers;
export const DisconnectReason: any = baileys.DisconnectReason;

// Some forks expose this with different naming
export const isJidNewsletter: any =
  baileys.isJidNewsletter ?? baileys.isJidNewsLetter ?? baileys.isJidNewsLetter;

// BufferJSON helper (used to serialize sessions)
export const BufferJSON = {
  replacer: (_key: string, value: any) => {
    if (value?.type === "Buffer" && Array.isArray(value?.data)) {
      return { type: "Buffer", data: Buffer.from(value.data).toString("base64") };
    }
    if (Buffer.isBuffer(value)) {
      return { type: "Buffer", data: value.toString("base64") };
    }
    return value;
  },
  reviver: (_key: string, value: any) => {
    if (value?.type === "Buffer" && typeof value?.data === "string") {
      return Buffer.from(value.data, "base64");
    }
    return value;
  }
};

// makeInMemoryStore — may live in different paths depending on the fork
const _resolveInMemoryStore = (): any => {
  if (baileys.makeInMemoryStore) return baileys.makeInMemoryStore;

  const subPaths = [
    "lib/Store/make-in-memory-store",
    "lib/Store/makeInMemoryStore",
    "Store/make-in-memory-store",
  ];
  const packages = ["@itsukichan/baileys", "@whiskeysockets/baileys"];
  for (const context of requireContexts) {
    for (const pkg of packages) {
      for (const sub of subPaths) {
        const mod = tryRequire(context.reqFn, `${context.label}::store`, `${pkg}/${sub}`, false);
        const fn = mod?.default ?? mod?.makeInMemoryStore ?? mod;
        if (typeof fn === "function") return fn;
      }

      // Também tenta caminhos absolutos a partir dos node_modules candidatos
      for (const nm of backendNodeModulesCandidates) {
        for (const sub of subPaths) {
          const mod = tryRequire(
            context.reqFn,
            `${context.label}::store-abs`,
            path.join(nm, ...pkg.split("/"), sub),
            false
          );
          const fn = mod?.default ?? mod?.makeInMemoryStore ?? mod;
          if (typeof fn === "function") return fn;
        }
      }
    }
  }

  // Stub: retorna um store "noop" que não faz nada mas não quebra
  return (_opts?: any) => ({
    bind: (_ev: any) => {},
    contacts: {},
    chats: { all: () => [] },
    messages: {},
    loadMessages: async () => [],
    loadMessage: async () => undefined,
    toJSON: () => ({}),
    fromJSON: () => {},
    readFromFile: () => {},
    writeToFile: () => {},
  });
};

export const makeInMemoryStore: any = _resolveInMemoryStore();

// --- Types (and dummy runtime bindings for legacy non-`import type` usage) ---
export type WASocket = any;
export const WASocket: any = baileys.WASocket;

export type BinaryNode = any;
export const BinaryNode: any = baileys.BinaryNode;

export type BaileysEventEmitter = any;
export const BaileysEventEmitter: any = baileys.BaileysEventEmitter;

export type Chat = any;
export const Chat: any = baileys.Chat;

export type ConnectionState = any;
export const ConnectionState: any = baileys.ConnectionState;

export type Contact = any;
export const Contact: any = baileys.Contact;

export type GroupMetadata = any;
export const GroupMetadata: any = baileys.GroupMetadata;

export type GroupParticipant = any;
export const GroupParticipant: any = baileys.GroupParticipant;

export type PresenceData = any;
export const PresenceData: any = baileys.PresenceData;

export type WAMessage = any;
export const WAMessage: any = baileys.WAMessage;

export type WAMessageContent = any;
export const WAMessageContent: any = baileys.WAMessageContent;

export type AnyMessageContent = any;
export const AnyMessageContent: any = baileys.AnyMessageContent;

export type WAMessageCursor = any;
export const WAMessageCursor: any = baileys.WAMessageCursor;

export type WAMessageKey = any;
export const WAMessageKey: any = baileys.WAMessageKey;

export type WAMessageStubType = any;
export const WAMessageStubType: any = baileys.WAMessageStubType;

export type WAMessageUpdate = any;
export const WAMessageUpdate: any = baileys.WAMessageUpdate;

export type WAPresence = any;
export const WAPresence: any = baileys.WAPresence;

export type MessageUpsertType = any;
export const MessageUpsertType: any = baileys.MessageUpsertType;

export type MediaType = any;
export const MediaType: any = baileys.MediaType;

export type AuthenticationCreds = any;
export const AuthenticationCreds: any = baileys.AuthenticationCreds;

export type AuthenticationState = any;
export const AuthenticationState: any = baileys.AuthenticationState;

export type SignalDataTypeMap = any;
export const SignalDataTypeMap: any = baileys.SignalDataTypeMap;
