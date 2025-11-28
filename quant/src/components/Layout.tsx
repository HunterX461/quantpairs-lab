import { BarChart3, TrendingUp, TestTube2, Activity, Settings } from 'lucide-react';
import { useNavigation } from '../context/NavigationContext';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { currentPage, navigateTo } = useNavigation();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'pairs-explorer', label: 'Pairs Explorer', icon: TrendingUp },
    { id: 'backtest-studio', label: 'Backtest Studio', icon: TestTube2 },
    { id: 'trade-simulator', label: 'Trade Simulator', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings }
  ] as const;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">QuantPairs Lab</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;

            return (
              <button
                key={item.id}
                onClick={() => navigateTo(item.id as any)}
                className={`
                  w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium
                  transition-colors
                  ${isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="text-xs text-gray-400">v1.0.0 - Market Data</div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900 capitalize">
                {currentPage.replace('-', ' ')}
              </h1>
              <p className="text-sm text-gray-500">Market-Neutral Stat Arb Research</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                TM
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
