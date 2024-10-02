import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import 'chart.js/auto';
import './App.css';

interface BlockMetrics {
  block_height: number;
  block_hash: string;
  transaction_count: number;
  market_price: number;
  total_sent_today: number;
  network_hashrate: number;
  blockchain_size: number;
}

interface BitcoinHistory {
  date: string;
  price: number;
}

const App: React.FC = () => {
  const [blockMetrics, setBlockMetrics] = useState<BlockMetrics | null>(null);
  const [bitcoinHistory, setBitcoinHistory] = useState<BitcoinHistory[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

  useEffect(() => {
    const fetchBlockMetrics = async () => {
      try {
        console.log('URL:', `${API_BASE_URL}/block_metrics`);
        const response = await axios.get<BlockMetrics>(`${API_BASE_URL}/block_metrics`);
        setBlockMetrics(response.data);
        console.log('Block metrics:', response.data);
      } catch (err) {
        setError('Failed to fetch block metrics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchBitcoinHistory = async () => {
      try {
        const response = await axios.get('https://api.coingecko.com/api/v3/coins/bitcoin/market_chart', {
          params: {
            vs_currency: 'usd',
            days: 1,
          },
        });
        const formattedData: BitcoinHistory[] = response.data.prices.map((price: [number, number]) => ({
          date: new Date(price[0]).toLocaleDateString(),
          price: price[1],
        }));
        setBitcoinHistory(formattedData);
      } catch (err) {
        console.error('Failed to fetch Bitcoin price history:', err);
      }
    };

    fetchBlockMetrics();
    fetchBitcoinHistory();
    const intervalId = setInterval(fetchBlockMetrics, 30000);
    return () => clearInterval(intervalId);
  }, [API_BASE_URL]);

  const chartData = {
    labels: bitcoinHistory ? bitcoinHistory.map(data => data.date) : [],
    datasets: [
      {
        label: 'Bitcoin Price (USD)',
        data: bitcoinHistory ? bitcoinHistory.map(data => data.price) : [],
        fill: true,
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) {
            return null;
          }
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(255, 99, 132, 0.5)');
          gradient.addColorStop(1, 'rgba(255, 99, 132, 0)');
          return gradient;
        },
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  const chartOptions: ChartOptions<'line'> = {
    scales: {
      x: {
        grid: {
          display: false,
        },
        display: false,
      },
      y: {
        grid: {
          display: false,
        },
        display: false,
      },
    },
    plugins: {
      legend: {
        display: true,
        position: 'top',
        align: 'start',
        labels: {
          generateLabels: (chart) => {
            const datasets = chart.data.datasets;
            return datasets.map((dataset, i) => ({
              text: dataset.label!,
              fillStyle: dataset.borderColor as string,
              strokeStyle: dataset.borderColor as string,
              lineWidth: dataset.borderWidth as number,
              hidden: !chart.isDatasetVisible(i),
              datasetIndex: i,
            }));
          },
          boxWidth: 40,
          boxHeight: 1,
          padding: 20,
        },
      },
    },
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bitcoin Explorer</h1>
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        {blockMetrics && (
          <div className="block-metrics">
            <h2>Block Metrics</h2>
            {bitcoinHistory && (
              <div className="bitcoin-history-chart">
                <Line data={chartData} options={chartOptions} />
              </div>
            )}
            <div className="metrics-container">
              <div className="metric-item">
                <p>{blockMetrics.block_height}</p>
                <h3>Block Height</h3>
              </div>
              <div className="metric-item">
                <p>{blockMetrics.block_hash.slice(-6)}</p>
                <h3>Block Hash</h3>
              </div>
              <div className="metric-item">
                <p>{blockMetrics.transaction_count}</p>
                <h3>Transaction Count</h3>
              </div>
              <div className="metric-item">
                <p>${blockMetrics.market_price.toFixed(2)}</p>
                <h3>Market Price (USD)</h3>
              </div>
              <div className="metric-item">
                <p>{blockMetrics.total_sent_today.toFixed(2)} BTC</p>
                <h3>Total Sent Today</h3>
              </div>
              <div className="metric-item">
                <p>{blockMetrics.network_hashrate.toFixed(2)} H/s</p>
                <h3>Network Hashrate</h3>
              </div>
              <div className="metric-item">
                <p>{blockMetrics.blockchain_size.toFixed(8)} GB</p>
                <h3>Blockchain Size</h3>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
};

export default App;