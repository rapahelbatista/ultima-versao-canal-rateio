/**
 * Spintax: expande {Olá|Oi|Bom dia} escolhendo aleatoriamente uma das opções.
 * Suporta aninhamento: "{Olá|Oi {amigo|querido}}"
 */
export const expandSpintax = (text: string): string => {
  if (!text) return text;
  const re = /\{([^{}]+)\}/;
  let result = text;
  let safety = 0;
  while (re.test(result) && safety < 100) {
    result = result.replace(re, (_, group: string) => {
      const options = group.split("|");
      return options[Math.floor(Math.random() * options.length)];
    });
    safety++;
  }
  return result;
};

/**
 * Delay aleatório humanizado entre min e max segundos.
 * Aplica curva normal (Box-Muller) para parecer mais humano que rand uniforme.
 */
export const humanizedDelayMs = (minSec: number, maxSec: number): number => {
  const min = Math.max(1, Math.min(minSec, maxSec));
  const max = Math.max(min, maxSec);
  const mean = (min + max) / 2;
  const std = (max - min) / 4;

  // Box-Muller
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);

  let value = mean + z * std;
  value = Math.max(min, Math.min(max, value));
  return Math.round(value * 1000);
};

/**
 * Verifica se agora está dentro da janela de envio configurada.
 * window: { start: "08:00", end: "18:00", days: [1,2,3,4,5], timezone?: "America/Sao_Paulo" }
 * days segue padrão JS: 0=Dom, 1=Seg, ..., 6=Sáb
 */
export interface SendWindow {
  start: string; // "HH:mm"
  end: string;   // "HH:mm"
  days: number[];
}

export const isWithinSendWindow = (window?: SendWindow | null, now: Date = new Date()): boolean => {
  if (!window) return true;
  const day = now.getDay();
  if (window.days?.length && !window.days.includes(day)) return false;

  const [sh, sm] = (window.start || "00:00").split(":").map(Number);
  const [eh, em] = (window.end || "23:59").split(":").map(Number);
  const startMin = sh * 60 + sm;
  const endMin = eh * 60 + em;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  return nowMin >= startMin && nowMin <= endMin;
};

/**
 * Calcula a próxima data válida dentro da janela de envio.
 */
export const nextSendableDate = (window?: SendWindow | null, from: Date = new Date()): Date => {
  if (!window) return from;
  const candidate = new Date(from);
  for (let i = 0; i < 8; i++) {
    if (isWithinSendWindow(window, candidate)) return candidate;
    // Próximo dia válido às start
    candidate.setDate(candidate.getDate() + 1);
    const [sh, sm] = (window.start || "00:00").split(":").map(Number);
    candidate.setHours(sh, sm, 0, 0);
  }
  return candidate;
};

/**
 * Round-robin determinístico para multi-chip.
 * Recebe array de WhatsAppIds e o índice global, retorna o id escolhido.
 */
export const pickWhatsappRoundRobin = (
  whatsappIds: number[] | null | undefined,
  fallbackId: number,
  index: number
): number => {
  if (!whatsappIds || whatsappIds.length === 0) return fallbackId;
  return whatsappIds[index % whatsappIds.length];
};
