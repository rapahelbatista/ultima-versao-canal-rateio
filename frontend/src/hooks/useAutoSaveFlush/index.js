import { useEffect, useRef } from "react";

/**
 * Garante o "flush" do auto-save ao:
 *  - desmontar o componente (navegar para outra página da SPA)
 *  - sair/atualizar a aba (beforeunload)
 *  - quando a aba fica oculta (visibilitychange) — útil no mobile
 *
 * @param {Function} saveFn  função assíncrona que persiste o estado atual
 * @param {boolean}  enabled habilita o flush (false enquanto carrega)
 */
const useAutoSaveFlush = (saveFn, enabled = true) => {
  const ref = useRef(saveFn);
  ref.current = saveFn;

  useEffect(() => {
    if (!enabled) return undefined;

    const flush = () => {
      try {
        const p = ref.current && ref.current();
        // Não dá para await em beforeunload, mas disparamos a request.
        return p;
      } catch (_) {
        return undefined;
      }
    };

    const handleBeforeUnload = () => { flush(); };
    const handleVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibility);
      // flush ao desmontar (mudança de rota dentro da SPA)
      flush();
    };
  }, [enabled]);
};

export default useAutoSaveFlush;
