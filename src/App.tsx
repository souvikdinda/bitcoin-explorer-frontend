import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import 'chart.js/auto';
import './App.css';

interface BlockMetrics {
  block_height: number;
  block_hash: string;
  btc: number;
  value: number;
  value_today: number;
  average_value: number;
  median_value: number;
  transaction_count: number;
  size: number;
  weight: number;
  difficulty: number;
  merkle_root: string;
  nonce: number;
  miner: string;
  network_hashrate: number;
  total_sent_today: number;
  blockchain_size: number;
}

interface BitcoinHistory {
  date: string;
  price: number;
}

const App: React.FC = () => {
  const [latestBlock, setLatestBlock] = useState<BlockMetrics | null>(null);
  const [blockDetails, setBlockDetails] = useState<BlockMetrics | null>(null);
  const [blockHistory, setBlockHistory] = useState<number[]>([]);
  const [bitcoinHistory, setBitcoinHistory] = useState<BitcoinHistory[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_API_URL;

  useEffect(() => {
    const fetchBlockMetrics = async () => {
      try {
        const response = await axios.get<BlockMetrics>(`${API_BASE_URL}/latest_block_metrics`);
        setLatestBlock(response.data);
      } catch (err) {
        setError('Failed to fetch block metrics.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchLatest15Blocks = async () => {
      try {
        const response = await axios.get<number[]>(`${API_BASE_URL}/latest_15_blocks`);
        setBlockHistory(response.data);
      } catch (err) {
        setError('Failed to fetch latest blocks.');
        console.error(err);
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
    fetchLatest15Blocks();
    fetchBitcoinHistory();
    const intervalId = setInterval(fetchBlockMetrics, 30000);
    return () => clearInterval(intervalId);
  }, [API_BASE_URL]);

  // Move fetchBlockDetails inside the component
  const fetchBlockDetails = async (blockHeight: number) => {
    try {
      const response = await axios.get<BlockMetrics>(`${API_BASE_URL}/block/${blockHeight}`);
      setBlockDetails(response.data);
    } catch (err) {
      setError('Failed to fetch block details.');
      console.error(err);
    }
  };

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
          gradient.addColorStop(0, 'rgba(255, 138, 101, 0.5)');
          gradient.addColorStop(1, 'rgba(255, 138, 101, 0)');
          return gradient;
        },
        borderColor: 'rgba(255, 138, 101, 1)',
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowToast(true); 
    setTimeout(() => {
      setShowToast(false);
    }, 2000);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Bitcoin Explorer</h1>
        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        
        {/* Latest Block Metrics */}
        {latestBlock && (
          <div className="block-metrics">
            <h2>Latest Block Details</h2>
            <div className="metrics-container">
              <div className="metric-item">
                <h3>Block Height</h3>
                <p>{latestBlock.block_height}</p>
              </div>
              <div className="metric-item">
                <h3>Block Hash</h3>
                <p>
                  {`${latestBlock.block_hash.slice(0, 5)}-${latestBlock.block_hash.slice(-5)}`}
                  <button 
                    className="copy-btn" 
                    onClick={() => copyToClipboard(latestBlock.block_hash)}>
                    <i className="far fa-copy"></i>
                  </button>
                </p>
              </div>
              <div className="metric-item">
                <h3>BTC</h3>
                <p>{latestBlock.btc}</p>
              </div>
              <div className="metric-item">
                <h3>Value</h3>
                <p>${latestBlock.value.toFixed(0)}</p>
              </div>
              <div className="metric-item">
                <h3>Value Today</h3>
                <p>${latestBlock.value_today.toFixed(0)}</p>
              </div>
              <div className="metric-item">
                <h3>Average Value</h3>
                <p>{latestBlock.average_value} BTC</p>
              </div>
              <div className="metric-item">
                <h3>Median Value</h3>
                <p>{latestBlock.median_value} BTC</p>
              </div>
              <div className="metric-item">
                <h3>Transactions</h3>
                <p>{latestBlock.transaction_count}</p>
              </div>
              <div className="metric-item">
                <h3>Size</h3>
                <p>{latestBlock.size}</p>
              </div>
              <div className="metric-item">
                <h3>Weight</h3>
                <p>{latestBlock.weight}</p>
              </div>
              <div className="metric-item">
                <h3>Difficulty</h3>
                <p>{latestBlock.difficulty}</p>
              </div>
              <div className="metric-item">
                <h3>Merkle Root</h3>
                <p>
                  {`${latestBlock.merkle_root.slice(0, 5)}-${latestBlock.merkle_root.slice(-5)}`}
                  <button 
                    className="copy-btn" 
                    onClick={() => copyToClipboard(latestBlock.merkle_root)}>
                    <i className="far fa-copy"></i>
                  </button>
                </p>
              </div>
              <div className="metric-item">
                <h3>Nonce</h3>
                <p>{latestBlock.nonce}</p>
              </div>
              <div className="metric-item">
                <h3>Miner</h3>
                <p>
                  {`${latestBlock.miner.slice(0, 2)}-${latestBlock.miner.slice(-8)}`}
                  <button 
                    className="copy-btn" 
                    onClick={() => copyToClipboard(latestBlock.miner)}>
                    <i className="far fa-copy"></i>
                  </button>
                </p>
              </div>
              <div className="metric-item">
                <h3>Network Hashrate</h3>
                <p>{latestBlock.network_hashrate.toFixed(2)} H/s</p>
              </div>
              <div className="metric-item">
                <h3>Total Sent Today</h3>
                <p>{latestBlock.total_sent_today.toFixed(2)} BTC</p>
              </div>
              <div className="metric-item">
                <h3>Blockchain Size</h3>
                <p>{latestBlock.blockchain_size.toFixed(8)} GB</p>
              </div>
            </div>
          </div>
        )}

        {/* Latest 15 Blocks */}
        <div className="block-history">
          <h2>Latest 15 Blocks</h2>
          <div className="block-chain-container">
            {blockHistory.length > 0 ? (
              blockHistory.map(blockHeight => (
                <div key={blockHeight} className="block-item" onClick={() => fetchBlockDetails(blockHeight)}>
                  {blockHeight}
                </div>
              ))
            ) : (
              <p>No blocks available</p>
            )}
          </div>
        </div>

        {/* Selected Block Details */}
        {blockDetails && (
          <div className="block-metrics">
            <h2>Bitcoin Block {blockDetails.block_height}</h2>
            <div className="metrics-container">
              <div className="metric-item">
                <h3>Block Height</h3>
                <p>{blockDetails.block_height}</p>
              </div>
              <div className="metric-item">
                <h3>Block Hash</h3>
                <p>
                  {`${blockDetails.block_hash.slice(0, 5)}-${blockDetails.block_hash.slice(-5)}`}
                  <button 
                    className="copy-btn" 
                    onClick={() => copyToClipboard(blockDetails.block_hash)}>
                    <i className="far fa-copy"></i>
                  </button>
                </p>
              </div>
              <div className="metric-item">
                <h3>BTC</h3>
                <p>{blockDetails.btc}</p>
              </div>
              <div className="metric-item">
                <h3>Value</h3>
                <p>${blockDetails.value.toFixed(0)}</p>
              </div>
              <div className="metric-item">
                <h3>Value Today</h3>
                <p>${blockDetails.value_today.toFixed(0)}</p>
              </div>
              <div className="metric-item">
                <h3>Average Value</h3>
                <p>{blockDetails.average_value} BTC</p>
              </div>
              <div className="metric-item">
                <h3>Median Value</h3>
                <p>{blockDetails.median_value} BTC</p>
              </div>
              <div className="metric-item">
                <h3>Transactions</h3>
                <p>{blockDetails.transaction_count}</p>
              </div>
              <div className="metric-item">
                <h3>Size</h3>
                <p>{blockDetails.size}</p>
              </div>
              <div className="metric-item">
                <h3>Weight</h3>
                <p>{blockDetails.weight}</p>
              </div>
              <div className="metric-item">
                <h3>Difficulty</h3>
                <p>{blockDetails.difficulty}</p>
              </div>
              <div className="metric-item">
                <h3>Merkle Root</h3>
                <p>
                  {`${blockDetails.merkle_root.slice(0, 5)}-${blockDetails.merkle_root.slice(-5)}`}
                  <button 
                    className="copy-btn" 
                    onClick={() => copyToClipboard(blockDetails.merkle_root)}>
                    <i className="far fa-copy"></i>
                  </button>
                </p>
              </div>
              <div className="metric-item">
                <h3>Nonce</h3>
                <p>{blockDetails.nonce}</p>
              </div>
              <div className="metric-item">
                <h3>Miner</h3>
                <p>
                  {`${blockDetails.miner.slice(0, 2)}-${blockDetails.miner.slice(-8)}`}
                  <button 
                    className="copy-btn" 
                    onClick={() => copyToClipboard(blockDetails.miner)}>
                    <i className="far fa-copy"></i>
                  </button>
                </p>
              </div>
              <div className="metric-item">
                <h3>Network Hashrate</h3>
                <p>{blockDetails.network_hashrate.toFixed(2)} H/s</p>
              </div>
              <div className="metric-item">
                <h3>Total Sent Today</h3>
                <p>{blockDetails.total_sent_today.toFixed(2)} BTC</p>
              </div>
              <div className="metric-item">
                <h3>Blockchain Size</h3>
                <p>{blockDetails.blockchain_size.toFixed(8)} GB</p>
              </div>
            </div>
          </div>
        )}

        {/* Bitcoin Price Chart */}
        {bitcoinHistory && (
          <div className="bitcoin-history-chart">
            <h2>Bitcoin Price History</h2>
            <Line data={chartData} options={chartOptions} />
          </div>
        )}
        {showToast && <div className="toast">Copied to clipboard!</div>}
      </header>
    </div>
  );
};

export default App;
