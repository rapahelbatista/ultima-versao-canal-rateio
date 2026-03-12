import {
  proto,
  AuthenticationCreds,
  AuthenticationState,
  SignalDataTypeMap,
  initAuthCreds as importedInitAuthCreds,
  BufferJSON
} from "@whiskeysockets/baileys";
import cacheLayer from "../libs/cache";
import Whatsapp from "../models/Whatsapp";

const resolveInitAuthCreds = (): (() => AuthenticationCreds) => {
  if (typeof importedInitAuthCreds === "function") {
    return importedInitAuthCreds as () => AuthenticationCreds;
  }

  const packageCandidates = ["@itsukichan/baileys", "@whiskeysockets/baileys"];
  const subPathCandidates = [
    "lib/Utils/auth-utils",
    "lib/Utils/auth-utils.js",
    "lib/Utils/auth-utils.cjs",
    "dist/Utils/auth-utils",
    "dist/Utils/auth-utils.js"
  ];

  for (const pkg of packageCandidates) {
    for (const subPath of subPathCandidates) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const mod = require(`${pkg}/${subPath}`);
        const fn = mod?.initAuthCreds ?? mod?.default?.initAuthCreds ?? (typeof mod === "function" ? mod : undefined);
        if (typeof fn === "function") {
          return fn as () => AuthenticationCreds;
        }
      } catch {
        // tenta próximo candidato
      }
    }
  }

  return () => {
    throw new Error("[BAILEYS] initAuthCreds indisponível no módulo carregado.");
  };
};

const initAuthCredsSafe = resolveInitAuthCreds();

export const useMultiFileAuthState = async (
  whatsapp: Whatsapp
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {
  const writeData = async (data: any, file: string) => {
    try {
      await cacheLayer.set(
        `sessions:${whatsapp.id}:${file}`,
        JSON.stringify(data, BufferJSON.replacer)
      );
    } catch (error) {
      console.log("writeData error", error);
      return null;
    }
  };

  const readData = async (file: string) => {
    try {
      const data = await cacheLayer.get(`sessions:${whatsapp.id}:${file}`);
      return JSON.parse(data, BufferJSON.reviver);
    } catch (error) {
      return null;
    }
  };

  const removeData = async (file: string) => {
    try {
      await cacheLayer.del(`sessions:${whatsapp.id}:${file}`);
    } catch {}
  };

  const legacyCreds = (() => {
    try {
      if (!whatsapp?.session) return null;
      const parsed = JSON.parse(whatsapp.session, BufferJSON.reviver);
      return parsed?.creds ?? null;
    } catch {
      return null;
    }
  })();

  const creds: AuthenticationCreds =
    (await readData("creds")) || legacyCreds || initAuthCredsSafe();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data: { [_: string]: SignalDataTypeMap[typeof type] } = {};
          await Promise.all(
            ids.map(async id => {
              let value = await readData(`${type}-${id}`);
              if (type === "app-state-sync-key" && value) {
                value = proto.Message.AppStateSyncKeyData.create(value);
              }

              data[id] = value;
            })
          );

          return data;
        },
        set: async data => {
          const tasks: Promise<void>[] = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const file = `${category}-${id}`;
              tasks.push(value ? writeData(value, file) : removeData(file));
            }
          }

          await Promise.all(tasks);
        }
      }
    },
    saveCreds: () => {
      return writeData(creds, "creds");
    }
  };
};