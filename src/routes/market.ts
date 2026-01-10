/**
 * Market Data Routes
 * Provides real-time and historical market data for charts
 */

import express from 'express';
import axios from 'axios';

const router = express.Router();

/**
 * GET /api/market/chart/:symbol
 * Fetch historical chart data for a symbol
 */
router.get('/chart/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const interval = req.query.interval || '5m'; // 5m, 15m, 1h, 1d
    const range = req.query.range || '1d'; // 1d, 5d, 1mo, 3mo, 1y
    
    // Fetch data from Yahoo Finance
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const params = {
      interval,
      range,
      includePrePost: true, // Include pre-market and after-hours
    };
    
    const response = await axios.get(yahooUrl, { params, timeout: 5000 });
    
    if (!response.data || !response.data.chart || !response.data.chart.result) {
      return res.status(404).json({
        success: false,
        error: 'Symbol not found or no data available',
      });
    }
    
    const result = response.data.chart.result[0];
    const timestamps = result.timestamp || [];
    const quote = result.indicators.quote[0];
    
    // Convert to Lightweight Charts format
    const chartData = timestamps.map((timestamp: number, index: number) => ({
      time: timestamp,
      open: quote.open[index] || 0,
      high: quote.high[index] || 0,
      low: quote.low[index] || 0,
      close: quote.close[index] || 0,
      volume: quote.volume[index] || 0,
    })).filter((candle: any) => 
      candle.open > 0 && 
      candle.high > 0 && 
      candle.low > 0 && 
      candle.close > 0
    );
    
    // Get current price and metadata
    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice || chartData[chartData.length - 1]?.close || 0;
    
    res.json({
      success: true,
      data: {
        symbol: meta.symbol,
        currentPrice,
        previousClose: meta.previousClose || 0,
        change: currentPrice - (meta.previousClose || 0),
        changePercent: ((currentPrice - (meta.previousClose || 0)) / (meta.previousClose || 1)) * 100,
        currency: meta.currency,
        exchangeName: meta.exchangeName,
        chartData,
      },
    });
  } catch (error: any) {
    console.error('Error fetching market data:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch market data',
      message: error.message,
    });
  }
});

/**
 * GET /api/market/quote/:symbol
 * Get current quote for a symbol
 */
router.get('/quote/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const params = {
      interval: '1m',
      range: '1d',
    };
    
    const response = await axios.get(yahooUrl, { params, timeout: 5000 });
    
    if (!response.data || !response.data.chart || !response.data.chart.result) {
      return res.status(404).json({
        success: false,
        error: 'Symbol not found',
      });
    }
    
    const result = response.data.chart.result[0];
    const meta = result.meta;
    
    res.json({
      success: true,
      data: {
        symbol: meta.symbol,
        price: meta.regularMarketPrice || 0,
        previousClose: meta.previousClose || 0,
        change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
        changePercent: (((meta.regularMarketPrice || 0) - (meta.previousClose || 0)) / (meta.previousClose || 1)) * 100,
        volume: meta.regularMarketVolume || 0,
        high: meta.regularMarketDayHigh || 0,
        low: meta.regularMarketDayLow || 0,
        open: meta.regularMarketOpen || 0,
        currency: meta.currency,
        exchangeName: meta.exchangeName,
      },
    });
  } catch (error: any) {
    console.error('Error fetching quote:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch quote',
    });
  }
});

export default router;

