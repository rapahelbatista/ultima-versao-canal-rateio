import { useContext, useMemo } from "react";
import { AuthContext } from "../../context/Auth/AuthContext";

/**
 * Permissão centralizada para recursos sensíveis (Warmer, Meta Templates,
 * API Keys). Libera acesso para super usuários ou administradores da empresa.
 *
 * @returns {{ allowed: boolean, isSuper: boolean, isAdmin: boolean, user: any }}
 */
const useCanManageMeta = () => {
  const { user } = useContext(AuthContext);
  return useMemo(() => {
    const isSuper = !!user?.super;
    const isAdmin = String(user?.profile || "").toLowerCase() === "admin";
    return {
      allowed: isSuper || isAdmin,
      isSuper,
      isAdmin,
      user,
    };
  }, [user]);
};

export default useCanManageMeta;
