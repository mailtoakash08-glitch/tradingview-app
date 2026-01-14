/**
 * Market Data Routes
 * Provides real-time and historical market data for charts
 */

import express from 'express';
import axios from 'axios';
import { ibkrClient } from '../services/ibkrClient';

const router = express.Router();

/**
 * GET /api/market/chart/:symbol
 * Fetch historical chart data for a symbol
 * Tries multiple sources for best data quality
 */
router.get('/chart/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const interval = req.query.interval || '5m'; // 5m, 15m, 1h, 1d
    const range = req.query.range || '1d'; // 1d, 5d, 1mo, 3mo, 1y
    
    // Try Yahoo Finance with better parameters for real-time data
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    const params = {
      interval,
      range,
      includePrePost: false, // Exclude pre/post market for consistency with TradingView
      // Add these for better real-time data
      events: 'div,split',
      corsdomain: 'finance.yahoo.com'
    };
    
    const response = await axios.get(yahooUrl, { 
      params, 
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      }
    });
    
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
        // Add metadata for debugging
        dataSource: 'Yahoo Finance',
        lastUpdate: new Date().toISOString(),
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

/**
 * GET /api/market/tws-quote/:symbol
 * Get real-time bid/ask from TWS/IB Gateway
 */
router.get('/tws-quote/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    if (!ibkrClient.isConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Not connected to TWS/IB Gateway',
      });
    }

    // Check if we already have data for this symbol
    let marketData = ibkrClient.getMarketData(symbol);
    
    // If no data, subscribe and wait a moment for initial tick
    if (!marketData) {
      await ibkrClient.subscribeMarketData(symbol);
      
      // Wait up to 2 seconds for initial data
      await new Promise(resolve => setTimeout(resolve, 2000));
      marketData = ibkrClient.getMarketData(symbol);
    }

    if (!marketData || (marketData.bid === 0 && marketData.ask === 0)) {
      return res.status(404).json({
        success: false,
        error: 'No market data available for symbol (check market hours and subscription)',
      });
    }

    res.json({
      success: true,
      data: {
        symbol: marketData.symbol,
        bid: marketData.bid,
        ask: marketData.ask,
        last: marketData.last,
        bidSize: marketData.bidSize,
        askSize: marketData.askSize,
        lastSize: marketData.lastSize,
        spread: marketData.ask - marketData.bid,
        midpoint: (marketData.bid + marketData.ask) / 2,
        lastUpdate: marketData.lastUpdate,
        source: 'TWS/IB Gateway',
      },
    });
  } catch (error: any) {
    console.error('Error fetching TWS quote:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch TWS quote',
      message: error.message,
    });
  }
});

/**
 * GET /api/market/tws-quotes
 * Get all subscribed market data
 */
router.get('/tws-quotes', async (req, res) => {
  try {
    if (!ibkrClient.isConnected()) {
      return res.status(503).json({
        success: false,
        error: 'Not connected to TWS/IB Gateway',
      });
    }

    const allData = ibkrClient.getAllMarketData();
    
    res.json({
      success: true,
      data: allData.map(md => ({
        symbol: md.symbol,
        bid: md.bid,
        ask: md.ask,
        last: md.last,
        bidSize: md.bidSize,
        askSize: md.askSize,
        spread: md.ask - md.bid,
        midpoint: (md.bid + md.ask) / 2,
        lastUpdate: md.lastUpdate,
      })),
      source: 'TWS/IB Gateway',
    });
  } catch (error: any) {
    console.error('Error fetching TWS quotes:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch TWS quotes',
    });
  }
});

export default router;

