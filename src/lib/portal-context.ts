import { createContext, useContext } from 'react';

export const PortalContext = createContext<HTMLElement | undefined>(undefined);

export function usePortalContainer() {
  return useContext(PortalContext);
}
