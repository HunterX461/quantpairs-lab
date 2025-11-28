import { NavigationProvider, useNavigation } from './context/NavigationContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PairsExplorer from './pages/PairsExplorer';
import BacktestStudio from './pages/BacktestStudio';
import TradeSimulator from './pages/TradeSimulator';
import Settings from './pages/Settings';

function AppContent() {
  const { currentPage } = useNavigation();

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pairs-explorer':
        return <PairsExplorer />;
      case 'backtest-studio':
        return <BacktestStudio />;
      case 'trade-simulator':
        return <TradeSimulator />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return <Layout>{renderPage()}</Layout>;
}

function App() {
  return (
    <NavigationProvider>
      <AppContent />
    </NavigationProvider>
  );
}

export default App;
