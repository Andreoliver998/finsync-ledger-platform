import { useEffect } from 'react';

import { useInvestigation } from '@contexts/InvestigationContext';

export function useInvestigationScreen(payload, deps = []) {
  const { syncInvestigationContext } = useInvestigation();

  useEffect(() => {
    if (!payload || payload.enabled === false) return;
    syncInvestigationContext(payload);
  }, [syncInvestigationContext, ...deps]);
}
