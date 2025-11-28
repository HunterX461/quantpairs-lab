import { createContext, useContext, useState, ReactNode } from 'react';

type Page = 'dashboard' | 'pairs-explorer' | 'backtest-studio' | 'trade-simulator' | 'settings';

interface NavigationContextType {
  currentPage: Page;
  navigateTo: (page: Page) => void;
  pageParams: Record<string, any>;
  setPageParams: (params: Record<string, any>) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [pageParams, setPageParams] = useState<Record<string, any>>({});

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
  };

  return (
    <NavigationContext.Provider value={{ currentPage, navigateTo, pageParams, setPageParams }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
