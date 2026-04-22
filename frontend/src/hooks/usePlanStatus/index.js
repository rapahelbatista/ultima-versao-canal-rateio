import { useContext, useEffect, useState } from "react";
import moment from "moment";
import { AuthContext } from "../../context/Auth/AuthContext";
import usePlans from "../usePlans";

/**
 * Determina o status de assinatura do usuário logado.
 *
 * Regras:
 *  - isPro: plano com valor > 0 E empresa NÃO vencida.
 *  - isExpired: dueDate da empresa ficou no passado.
 *  - subscriptionLabel: "Ver assinatura" se Pro, "Fazer upgrade ✨" caso contrário.
 *
 * Returns: { isPro, isExpired, plan, loading, subscriptionLabel }
 */
const usePlanStatus = () => {
  const { user } = useContext(AuthContext);
  const { getPlanCompany } = usePlans();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!user?.companyId) return undefined;
    setLoading(true);
    getPlanCompany({}, user.companyId)
      .then((data) => {
        if (!alive) return;
        setPlan(data?.plan || data || null);
      })
      .catch(() => alive && setPlan(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.companyId]);

  const dueDate = user?.company?.dueDate;
  const isExpired = dueDate ? moment().isAfter(moment(dueDate)) : false;

  const planValue = Number(plan?.value ?? plan?.price ?? user?.company?.plan?.value ?? 0);
  const isPaidPlan = planValue > 0;
  const isPro = isPaidPlan && !isExpired;

  const subscriptionLabel = isPro ? "Ver assinatura" : "Fazer upgrade ✨";

  return { isPro, isExpired, plan, loading, subscriptionLabel };
};

export default usePlanStatus;
