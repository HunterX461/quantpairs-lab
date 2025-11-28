import { Activity, Clock } from 'lucide-react';
import Card from '../components/Card';

export default function TradeSimulator() {
  return (
    <div className="max-w-4xl mx-auto">
      <Card className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
          <Activity className="w-8 h-8 text-blue-600" />
        </div>

        <h2 className="text-2xl font-semibold text-gray-900 mb-4">
          Live Trade Simulator - Coming Soon
        </h2>

        <p className="text-gray-600 max-w-2xl mx-auto mb-8">
          This module will simulate order execution, slippage, and transaction costs on
          real-time or delayed market data. Test your strategies in a realistic environment
          before deploying capital.
        </p>

        <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Planned Features</h3>
          <ul className="text-left space-y-2 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Real-time market data integration with configurable latency</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Realistic order execution with market impact modeling</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Slippage simulation based on historical volatility</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Commission and fee structures for different brokers</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Paper trading with live position tracking</span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
              <span>Risk management tools and position limits</span>
            </li>
          </ul>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          <span>Expected release: Q2 2024</span>
        </div>
      </Card>
    </div>
  );
}
