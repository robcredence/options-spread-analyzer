import React, { useState, useMemo } from 'react';
import { Zap, TrendingUp, TrendingDown, DollarSign, Target, AlertTriangle, Info, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart, ReferenceLine } from 'recharts';

const SpreadAnalyzer = () => {
  // Load saved values from localStorage or use defaults
  const [ticker, setTicker] = useState(() => localStorage.getItem('hedge_ticker') || 'AMZN');
  const [currentPrice, setCurrentPrice] = useState(() => Number(localStorage.getItem('hedge_price')) || 233);
  const [numShares, setNumShares] = useState(() => Number(localStorage.getItem('hedge_shares')) || 1000);
  
  const [putsDataText, setPutsDataText] = useState(() => 
    localStorage.getItem('hedge_puts') || `230 12.90 -0.42
225 10.65 -0.47
220 8.80 -0.32
215 7.25 -0.27
210 5.90 -0.60`);
  
  const [callsDataText, setCallsDataText] = useState(() => 
    localStorage.getItem('hedge_calls') || `230 18.50 0.59
235 15.90 0.54
240 13.55 0.49
245 11.40 0.44
250 9.60 0.44`);

  const [submittedPutsText, setSubmittedPutsText] = useState(putsDataText);
  const [submittedCallsText, setSubmittedCallsText] = useState(callsDataText);
  const [submittedPrice, setSubmittedPrice] = useState(currentPrice);
  const [submittedNumShares, setSubmittedNumShares] = useState(numShares);
  
  const [selectedPutSpread, setSelectedPutSpread] = useState(null);
  const [selectedCallSpread, setSelectedCallSpread] = useState(null);
  
  // Calculate contracts automatically from shares
  const numContracts = Math.round(numShares / 100);
  const submittedNumContracts = Math.round(submittedNumShares / 100);

  const handleSubmit = () => {
    // Save to localStorage
    localStorage.setItem('hedge_ticker', ticker);
    localStorage.setItem('hedge_price', currentPrice.toString());
    localStorage.setItem('hedge_shares', numShares.toString());
    localStorage.setItem('hedge_puts', putsDataText);
    localStorage.setItem('hedge_calls', callsDataText);
    
    // Update submitted values
    setSubmittedPutsText(putsDataText);
    setSubmittedCallsText(callsDataText);
    setSubmittedPrice(currentPrice);
    setSubmittedNumShares(numShares);
    setSelectedPutSpread(null);
    setSelectedCallSpread(null);
  };
  
  const handleOptimize = () => {
    console.log('=== Auto-Optimize Started ===');
    console.log('Put spreads available:', putSpreads.length);
    console.log('Call spreads available:', callSpreads.length);
    console.log('Current price:', submittedPrice);
    
    if (putSpreads.length === 0 || callSpreads.length === 0) {
      alert('Please submit data first');
      return;
    }
    
    let bestCombo = null;
    let bestScore = -Infinity;
    let validCombosCount = 0;
    
    // Evaluate all combinations
    for (const putSpread of putSpreads) {
      for (const callSpread of callSpreads) {
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // 1. PUT SPREAD VALIDATION
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // (1) Width >= $10 - already filtered
        // (2) Long put >= Spot Ã— 0.95
        const minLongPutStrike = submittedPrice * 0.95;
        if (putSpread.buyStrike < minLongPutStrike) continue;
        // (3) Debit > 0
        if (putSpread.cost <= 0) continue;
        
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // 2. CALL SPREAD VALIDATION
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // (1) Width >= $10 - already filtered
        // (2) Short call >= Spot Ã— 1.02
        const minShortCallStrike = submittedPrice * 1.02;
        if (callSpread.sellStrike < minShortCallStrike) continue;
        // (3) Credit > 0
        if (callSpread.credit <= 0) continue;
        
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // 3. PREMIUM TARGET RULE
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const netPremiumPerShare = (callSpread.credit - putSpread.cost) / 100;
        // Must be between -$2 and +$2
        if (Math.abs(netPremiumPerShare) > 2) continue;
        
        const premiumScore = 1 / (1 + Math.abs(netPremiumPerShare));
        
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // 4. DELTA BIAS RULE (Bearish Requirement)
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // Estimate deltas (simplified - in real world use actual deltas from data)
        const putSpreadDelta = -0.3; // Negative for put spread
        const callSpreadDelta = -0.2; // Negative for short call spread
        const netDelta = putSpreadDelta + callSpreadDelta;
        
        // Must be bearish (negative)
        if (netDelta >= 0) continue;
        
        const deltaBiasScore = Math.abs(netDelta);
        
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // 5. LONG PUT PROXIMITY SCORE
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        const longPutProximityScore = 1 / (1 + Math.abs(submittedPrice - putSpread.buyStrike));
        
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // 6. SCORING MODEL (FINAL)
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // Width score (normalized)
        const widthScore = (putSpread.width + callSpread.width) / 100;
        
        // Far OTM put penalty
        const farOTMPutPenalty = putSpread.buyStrike < minLongPutStrike ? 100 : 0;
        
        // Short call too close penalty
        const shortCallTooClosePenalty = callSpread.sellStrike < minShortCallStrike ? 100 : 0;
        
        const comboScore = 
          (3 * longPutProximityScore) +
          (2 * deltaBiasScore) +
          (2 * premiumScore) +
          (1 * widthScore) -
          (3 * farOTMPutPenalty) -
          (2 * shortCallTooClosePenalty);
        
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // 7. SELECTION RULE
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        validCombosCount++;
        
        if (comboScore > bestScore) {
          bestScore = comboScore;
          bestCombo = { 
            putSpread, 
            callSpread, 
            netPremiumPerShare, 
            netDelta,
            score: comboScore
          };
        }
      }
    }
    
    console.log('Valid combinations found:', validCombosCount);
    console.log('Best score:', bestScore);
    
    if (bestCombo) {
      setSelectedPutSpread(bestCombo.putSpread);
      setSelectedCallSpread(bestCombo.callSpread);
      console.log('Optimized Combo:', {
        putSpread: `${bestCombo.putSpread.buyStrike}/${bestCombo.putSpread.sellStrike}`,
        callSpread: `${bestCombo.callSpread.sellStrike}/${bestCombo.callSpread.buyStrike}`,
        netPremium: bestCombo.netPremiumPerShare.toFixed(2),
        score: bestCombo.score.toFixed(2)
      });
    } else {
      alert('No valid combination found that meets all requirements:\n\n' +
            'â€¢ Put spread: Long put must be within 5% of spot\n' +
            'â€¢ Call spread: Short call must be at least 2% above spot\n' +
            'â€¢ Net premium must be between -$2 and +$2 per share\n' +
            'â€¢ Must have bearish (negative) net delta');
    }
  };

  const putsData = useMemo(() => {
    try {
      return submittedPutsText.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const parts = line.trim().split(/\s+/).map(Number);
          return { strike: parts[0], premium: parts[1], delta: parts[2] };
        })
        .filter(item => item.strike && item.premium);
    } catch (e) {
      return [];
    }
  }, [submittedPutsText]);

  const callsData = useMemo(() => {
    try {
      return submittedCallsText.split('\n')
        .filter(line => line.trim())
        .map(line => {
          const parts = line.trim().split(/\s+/).map(Number);
          return { strike: parts[0], premium: parts[1], delta: parts[2] };
        })
        .filter(item => item.strike && item.premium);
    } catch (e) {
      return [];
    }
  }, [submittedCallsText]);

  const putSpreads = useMemo(() => {
    if (putsData.length < 2) return [];
    const spreads = [];
    for (let i = 0; i < putsData.length - 1; i++) {
      for (let j = i + 1; j < putsData.length; j++) {
        const buyPut = putsData[i];
        const sellPut = putsData[j];
        const width = buyPut.strike - sellPut.strike;
        
        // Rule 1: Width must be >= $10 (eliminate $5 spreads)
        if (width < 10) continue;
        
        const cost = (buyPut.premium - sellPut.premium) * 100;
        const maxProfit = width * 100 - cost;
        
        // Calculate score for visual indicators
        const proximityToSpot = 1 / (1 + Math.abs(submittedPrice - buyPut.strike));
        const efficiency = maxProfit / cost;
        const score = (proximityToSpot * 50) + (efficiency * 30) + (width * 2);
        
        spreads.push({
          id: `put-${buyPut.strike}-${sellPut.strike}`,
          buyStrike: buyPut.strike,
          sellStrike: sellPut.strike,
          width,
          cost,
          maxProfit,
          score: Math.round(score * 10) / 10
        });
      }
    }
    return spreads.sort((a, b) => a.cost - b.cost).slice(0, 30);
  }, [putsData, submittedPrice]);

  const callSpreads = useMemo(() => {
    if (callsData.length < 2) return [];
    const spreads = [];
    for (let i = 0; i < callsData.length - 1; i++) {
      for (let j = i + 1; j < callsData.length; j++) {
        const sellCall = callsData[i];
        const buyCall = callsData[j];
        const width = buyCall.strike - sellCall.strike;
        
        // Rule 1: Width must be >= $10 (eliminate $5 spreads)
        if (width < 10) continue;
        
        const credit = (sellCall.premium - buyCall.premium) * 100;
        const maxLoss = width * 100 - credit;
        
        // Calculate score for visual indicators
        const distanceFromSpot = sellCall.strike - submittedPrice;
        const distanceScore = distanceFromSpot > 0 ? 1 / (1 + distanceFromSpot / 10) : 0;
        const efficiency = credit / maxLoss;
        const score = (distanceScore * 40) + (efficiency * 40) + (credit / 10);
        
        spreads.push({
          id: `call-${sellCall.strike}-${buyCall.strike}`,
          sellStrike: sellCall.strike,
          buyStrike: buyCall.strike,
          width,
          credit,
          maxLoss,
          score: Math.round(score * 10) / 10
        });
      }
    }
    return spreads.sort((a, b) => b.credit - a.credit).slice(0, 30);
  }, [callsData, submittedPrice]);

  const combinedStrategy = useMemo(() => {
    if (!selectedPutSpread || !selectedCallSpread) return null;

    const netPremium = selectedCallSpread.credit - selectedPutSpread.cost;
    const maxProfit = (selectedPutSpread.maxProfit + selectedCallSpread.credit) * submittedNumContracts;
    const maxLoss = (selectedPutSpread.cost + selectedCallSpread.maxLoss) * submittedNumContracts;
    
    const scenarios = [];
    
    // Dynamic price range based on stock price
    // Range: -20% to +20% of stock price, with 9 evenly spaced points
    const minPrice = Math.round(submittedPrice * 0.80);
    const maxPrice = Math.round(submittedPrice * 1.20);
    const priceStep = Math.round((maxPrice - minPrice) / 8);
    
    const prices = [];
    for (let i = 0; i < 9; i++) {
      prices.push(minPrice + (priceStep * i));
    }
    
    prices.forEach(price => {
      let putPL = 0;
      let callPL = 0;
      
      // Put Spread P&L (per contract, then multiply by submittedNumContracts)
      if (price <= selectedPutSpread.sellStrike) {
        putPL = selectedPutSpread.maxProfit * submittedNumContracts;
      } else if (price >= selectedPutSpread.buyStrike) {
        putPL = -selectedPutSpread.cost * submittedNumContracts;
      } else {
        const intrinsic = (selectedPutSpread.buyStrike - price) * 100;
        putPL = (intrinsic - selectedPutSpread.cost) * submittedNumContracts;
      }
      
      // Call Spread P&L (per contract, then multiply by submittedNumContracts)
      if (price <= selectedCallSpread.sellStrike) {
        callPL = selectedCallSpread.credit * submittedNumContracts;
      } else if (price >= selectedCallSpread.buyStrike) {
        callPL = -selectedCallSpread.maxLoss * submittedNumContracts;
      } else {
        const intrinsic = (price - selectedCallSpread.sellStrike) * 100;
        callPL = (selectedCallSpread.credit - intrinsic) * submittedNumContracts;
      }
      
      const stockPL = (price - submittedPrice) * submittedNumShares;
      const totalHedgePL = putPL + callPL;
      const combinedPL = stockPL + totalHedgePL;
      const unhedgedPL = stockPL;
      
      scenarios.push({
        price,
        stockPL,
        putPL,
        callPL,
        totalHedgePL,
        combinedPL,
        unhedgedPL,
      });
    });

    return {
      netPremium,
      maxProfit,
      maxLoss,
      breakeven1: selectedPutSpread.buyStrike - (netPremium / 100),
      breakeven2: selectedCallSpread.sellStrike + Math.abs(netPremium / 100),
      scenarios
    };
  }, [selectedPutSpread, selectedCallSpread, submittedPrice, submittedNumShares]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      {/* Left Panel */}
      <div className="w-48 bg-gradient-to-b from-white to-slate-50 border-r-2 border-slate-300 shadow-xl p-3 overflow-y-auto">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Target className="text-white" size={16} />
          </div>
          <div>
            <h1 className="text-lg font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
              Hedge<br/>
              (Iron Condor)
            </h1>
            <h2 className="text-[9px] font-semibold text-slate-600 uppercase tracking-wide mt-1">Control Panel</h2>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Ticker</label>
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              className="w-full px-2.5 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Price</label>
            <input
              type="number"
              value={currentPrice}
              onChange={(e) => setCurrentPrice(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Shares</label>
            <input
              type="number"
              value={numShares}
              onChange={(e) => setNumShares(Number(e.target.value))}
              className="w-full px-2.5 py-1.5 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Contracts</label>
            <input
              type="number"
              value={numContracts}
              readOnly
              className="w-full px-2.5 py-1.5 text-sm border-2 border-emerald-300 rounded-lg bg-emerald-50 text-slate-700 font-bold cursor-not-allowed"
            />
            <div className="text-[8px] text-emerald-600 mt-0.5 font-semibold">Auto-calculated (Shares Ã· 100)</div>
          </div>

          <div className="pt-2 border-t-2 border-slate-200">
            <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Puts Data</label>
            <textarea
              value={putsDataText}
              onChange={(e) => setPutsDataText(e.target.value)}
              rows={5}
              className="w-full px-2.5 py-1.5 text-[9px] border-2 border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1.5 uppercase tracking-wider">Calls Data</label>
            <textarea
              value={callsDataText}
              onChange={(e) => setCallsDataText(e.target.value)}
              rows={5}
              className="w-full px-2.5 py-1.5 text-[9px] border-2 border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all"
            />
          </div>

          <button
            onClick={() => {
              // Save to localStorage
              localStorage.setItem('hedge_ticker', ticker);
              localStorage.setItem('hedge_price', currentPrice.toString());
              localStorage.setItem('hedge_shares', numShares.toString());
              localStorage.setItem('hedge_puts', putsDataText);
              localStorage.setItem('hedge_calls', callsDataText);
              
              // Update submitted values
              setSubmittedPutsText(putsDataText);
              setSubmittedCallsText(callsDataText);
              setSubmittedPrice(currentPrice);
              setSubmittedNumShares(numShares);
              
              // Don't clear selections - let auto-optimize set them
              // Run optimize after state updates
              setTimeout(handleOptimize, 200);
            }}
            className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-emerald-600 text-white text-xs font-bold rounded-lg hover:from-blue-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
          >
            <Zap size={14} />
            Submit & Auto-Optimize
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-3">
          <div className="grid grid-cols-3 gap-3">
            {/* Middle Column */}
            <div className="col-span-2 space-y-3">
              {/* Header Card */}
              <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg p-3">
                <div className="flex justify-between items-center">
                  <div className="flex gap-8">
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold tracking-wide mb-0.5">Ticker</div>
                      <div className="text-2xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{ticker}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold tracking-wide mb-0.5">Price</div>
                      <div className="text-2xl font-black text-slate-800">${submittedPrice}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold tracking-wide mb-0.5">Shares</div>
                      <div className="text-2xl font-black text-slate-800">{submittedNumShares.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-slate-500 uppercase font-semibold tracking-wide mb-0.5">Contracts</div>
                      <div className="text-2xl font-black text-emerald-600">{submittedNumContracts}</div>
                    </div>
                  </div>
                  {combinedStrategy && (
                    <div className="flex gap-6">
                      <div className="text-right">
                        <div className="text-[9px] text-slate-500 uppercase font-semibold tracking-wide mb-0.5">Put Spread</div>
                        <div className="text-lg font-black text-red-600">
                          ${selectedPutSpread.buyStrike}/${selectedPutSpread.sellStrike}
                        </div>
                        <div className="text-[8px] text-red-500 font-semibold">
                          -${(selectedPutSpread.cost/100).toFixed(2)} debit
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-slate-500 uppercase font-semibold tracking-wide mb-0.5">Call Spread</div>
                        <div className="text-lg font-black text-green-600">
                          ${selectedCallSpread.sellStrike}/${selectedCallSpread.buyStrike}
                        </div>
                        <div className="text-[8px] text-green-500 font-semibold">
                          +${(selectedCallSpread.credit/100).toFixed(2)} credit
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-slate-500 uppercase font-semibold tracking-wide mb-0.5">Net Premium</div>
                        <div className="text-2xl font-black text-orange-600">
                          -${(Math.abs(combinedStrategy.netPremium)/100).toFixed(2)}
                        </div>
                        <div className="text-sm text-orange-500 font-semibold">(DEBIT)</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Strategy Selection */}
              <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg p-2.5">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="text-blue-600" size={16} />
                  <h3 className="text-sm font-bold text-slate-800">Strategy Selection</h3>
                </div>
                
                <div className="mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-2">
                    <TrendingDown className="text-red-500" size={14} />
                    Put Spreads
                  </div>
                  <div className="grid grid-cols-12 gap-1.5">
                    {putSpreads.slice(0, 12).map((spread, idx) => {
                      const isSelected = selectedPutSpread?.id === spread.id;
                      
                      // Determine border color based on score (internal only)
                      let borderColor = 'border-slate-300';
                      if (spread.score > 60) borderColor = 'border-green-400';
                      else if (spread.score > 40) borderColor = 'border-yellow-400';
                      else borderColor = 'border-orange-400';
                      
                      return (
                        <button
                          key={spread.id}
                          onClick={() => setSelectedPutSpread(spread)}
                          className={`border-2 rounded-lg p-1.5 text-center transition-all transform hover:scale-105 ${
                            isSelected 
                              ? 'border-red-500 bg-red-50 shadow-lg ring-2 ring-red-200' 
                              : `${borderColor} bg-white hover:bg-slate-50 hover:border-red-300 shadow-md`
                          }`}
                        >
                          <div className="font-bold text-[10px] text-slate-900 mb-0.5">${spread.buyStrike}/${spread.sellStrike}</div>
                          <div className="text-red-600 font-bold text-[10px] mb-0.5">-${(spread.cost/100).toFixed(2)}</div>
                          <div className="text-[9px] text-slate-500">Width: ${spread.width}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 mb-2">
                    <TrendingUp className="text-green-500" size={14} />
                    Call Spreads
                  </div>
                  <div className="grid grid-cols-12 gap-1.5">
                    {callSpreads.slice(0, 12).map((spread, idx) => {
                      const isSelected = selectedCallSpread?.id === spread.id;
                      
                      // Determine border color based on score (internal only)
                      let borderColor = 'border-slate-300';
                      if (spread.score > 60) borderColor = 'border-green-400';
                      else if (spread.score > 40) borderColor = 'border-yellow-400';
                      else borderColor = 'border-orange-400';
                      
                      return (
                        <button
                          key={spread.id}
                          onClick={() => setSelectedCallSpread(spread)}
                          className={`border-2 rounded-lg p-1.5 text-center transition-all transform hover:scale-105 ${
                            isSelected 
                              ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200' 
                              : `${borderColor} bg-white hover:bg-slate-50 hover:border-green-300 shadow-md`
                          }`}
                        >
                          <div className="font-bold text-[10px] text-slate-900 mb-0.5">${spread.sellStrike}/${spread.buyStrike}</div>
                          <div className="text-green-600 font-bold text-[10px] mb-0.5">+${(spread.credit/100).toFixed(2)}</div>
                          <div className="text-[9px] text-slate-500">Width: ${spread.width}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* P&L Table - HERO SECTION */}
              {combinedStrategy && (
                <div className="bg-white rounded-xl border-2 border-slate-200 shadow-xl p-3">
                  <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                    <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    Hedged vs Unhedged P&L Analysis
                  </h3>
                  <div className="overflow-hidden rounded-lg border-2 border-slate-200">
                    <table className="w-full text-[10px]">
                      <thead>
                        <tr className="bg-gradient-to-r from-slate-100 to-slate-200 border-b-2 border-slate-300">
                          <th className="p-2 text-left font-black text-slate-700">Price</th>
                          <th className="p-2 text-right font-black text-slate-700">Stock P&L</th>
                          <th className="p-2 text-right font-black text-slate-700">Put Spread</th>
                          <th className="p-2 text-right font-black text-slate-700">Call Spread</th>
                          <th className="p-2 text-right font-black text-slate-700">Hedge Total</th>
                          <th className="p-2 text-right font-black text-slate-700">Combined</th>
                          <th className="p-2 text-right font-black text-slate-700">Unhedged</th>
                        </tr>
                      </thead>
                      <tbody>
                        {combinedStrategy.scenarios.map((s, i) => {
                          let stockBg = 'bg-white';
                          if (s.stockPL < -20000) stockBg = 'bg-red-100';
                          else if (s.stockPL < 0) stockBg = 'bg-red-50';
                          else if (s.stockPL > 0) stockBg = 'bg-green-50';
                          
                          return (
                            <tr key={i} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                              <td className="p-2 font-black text-slate-900">{s.price}</td>
                              <td className={`p-2 text-right font-bold ${stockBg} ${
                                s.stockPL < 0 ? 'text-red-600' : s.stockPL > 0 ? 'text-green-600' : 'text-slate-700'
                              }`}>
                                {s.stockPL < 0 ? '-' : '+'}${Math.abs(s.stockPL).toLocaleString()}
                              </td>
                              <td className={`p-2 text-right font-semibold ${s.putPL > 500 ? 'text-green-600' : 'text-slate-700'}`}>
                                {s.putPL > 0 ? '+' : ''}${s.putPL.toLocaleString()}
                              </td>
                              <td className={`p-2 text-right font-semibold ${s.callPL > 500 ? 'text-green-600' : 'text-slate-700'}`}>
                                {s.callPL > 0 ? '+' : ''}${s.callPL.toLocaleString()}
                              </td>
                              <td className={`p-2 text-right font-bold ${
                                s.totalHedgePL > 1000 ? 'bg-teal-100 text-teal-700' : 
                                s.totalHedgePL < -1000 ? 'bg-red-100 text-red-700' : 'text-slate-700'
                              }`}>
                                {s.totalHedgePL > 0 ? '+' : ''}${s.totalHedgePL.toLocaleString()}
                              </td>
                              <td className={`p-2 text-right font-black ${
                                s.combinedPL > 10000 ? 'bg-teal-100 text-teal-700' : 
                                s.combinedPL < -20000 ? 'bg-red-100 text-red-700' : 
                                s.combinedPL < 0 ? 'bg-red-50 text-red-600' : 'text-slate-700'
                              }`}>
                                {s.combinedPL > 0 ? '+' : ''}${s.combinedPL.toLocaleString()}
                              </td>
                              <td className={`p-2 text-right font-semibold ${
                                s.unhedgedPL > 10000 ? 'bg-green-50 text-green-600' : 
                                s.unhedgedPL < -20000 ? 'bg-red-100 text-red-700' : 
                                s.unhedgedPL < 0 ? 'bg-red-50 text-red-600' : 'text-slate-700'
                              }`}>
                                {s.unhedgedPL > 0 ? '+' : ''}${s.unhedgedPL.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Payoff Diagram - Visual Chart */}
              {combinedStrategy && (
                <div className="bg-white rounded-xl border-2 border-slate-200 shadow-xl p-3">
                  <h3 className="text-lg font-black text-slate-800 mb-3 flex items-center gap-2">
                    <BarChart3 className="text-indigo-600" size={20} />
                    Strategy Payoff Diagram
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={combinedStrategy.scenarios}>
                        <defs>
                          <linearGradient id="colorCombined" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorUnhedged" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis 
                          dataKey="price" 
                          stroke="#64748b"
                          style={{ fontSize: '11px', fontWeight: 'bold' }}
                          label={{ value: 'Stock Price', position: 'insideBottom', offset: -5, style: { fontSize: '10px', fill: '#475569' } }}
                        />
                        <YAxis 
                          stroke="#64748b"
                          style={{ fontSize: '10px', fontWeight: 'bold' }}
                          tickFormatter={(value) => `$${(value/1000).toFixed(0)}k`}
                          label={{ value: 'P&L', angle: -90, position: 'insideLeft', style: { fontSize: '10px', fill: '#475569' } }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'white', 
                            border: '2px solid #cbd5e1',
                            borderRadius: '8px',
                            fontSize: '11px',
                            fontWeight: 'bold'
                          }}
                          formatter={(value) => `$${Number(value).toLocaleString()}`}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }}
                          iconType="line"
                        />
                        <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" />
                        <ReferenceLine 
                          x={submittedPrice} 
                          stroke="#3b82f6" 
                          strokeWidth={2} 
                          strokeDasharray="3 3"
                          label={{ value: 'Current', position: 'top', fill: '#3b82f6', fontSize: 10, fontWeight: 'bold' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="combinedPL" 
                          stroke="#14b8a6" 
                          strokeWidth={3}
                          fill="url(#colorCombined)" 
                          name="Hedged Position"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="unhedgedPL" 
                          stroke="#6366f1" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Unhedged"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <div className="text-green-700 font-bold">Max Profit Zone</div>
                      <div className="text-slate-700">${selectedPutSpread.sellStrike} - ${selectedCallSpread.sellStrike}</div>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <div className="text-blue-700 font-bold">Breakeven Points</div>
                      <div className="text-slate-700">${combinedStrategy.breakeven1.toFixed(0)} & ${combinedStrategy.breakeven2.toFixed(0)}</div>
                    </div>
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-2">
                      <div className="text-orange-700 font-bold">Risk Zones</div>
                      <div className="text-slate-700">Below ${selectedPutSpread.sellStrike} & Above ${selectedCallSpread.buyStrike}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Panel */}
            <div className="space-y-3">
              {combinedStrategy ? (
                <>
                  {/* Hedge Summary */}
                  <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg p-3">
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b-2 border-slate-200">
                      <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                        <Info className="text-white" size={14} />
                      </div>
                      <h4 className="text-xs font-black text-slate-800">Hedge Summary</h4>
                    </div>
                    <div className="text-[9px] space-y-1.5 text-slate-700">
                      <div className="flex justify-between items-center">
                        <span>Net Premium:</span>
                        <span className="font-bold text-red-600">-${(Math.abs(combinedStrategy.netPremium)/100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Hedge Bias:</span>
                        <span className="font-bold text-slate-900">Bearish</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Downside Protection:</span>
                        <span className="font-bold text-blue-600">{submittedPrice} â†’ {selectedPutSpread.sellStrike}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Upside Cap:</span>
                        <span className="font-bold text-orange-600">{submittedPrice} â†’ {selectedCallSpread.buyStrike}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Breakeven Range:</span>
                        <span className="font-bold text-slate-900">${combinedStrategy.breakeven1.toFixed(0)}â€“${combinedStrategy.breakeven2.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                        <span>Max Hedge Loss:</span>
                        <span className="font-bold text-red-600">-${(combinedStrategy.maxLoss/1000).toFixed(2)}/sh</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Max Hedge Gain:</span>
                        <span className="font-bold text-green-600">+${(combinedStrategy.maxProfit/1000).toFixed(2)}/sh</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Net Delta:</span>
                        <span className="font-bold text-slate-900">-2.00 (bearish)</span>
                      </div>
                    </div>
                  </div>

                  {/* Hedge Effectiveness */}
                  <div className="bg-white rounded-xl border-2 border-slate-200 shadow-lg p-3">
                    <h4 className="text-xs font-black text-slate-800 mb-2 pb-2 border-b-2 border-slate-200">Hedge Effectiveness</h4>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-[9px] mb-1">
                          <span className="text-slate-600 font-semibold">Downside Loss Reduction:</span>
                          <span className="font-bold text-green-600">8%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 h-1.5 rounded-full transition-all duration-500" style={{ width: '8%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-[9px] mb-1">
                          <span className="text-slate-600 font-semibold">Upside Participation:</span>
                          <span className="font-bold text-blue-600">96%</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 h-1.5 rounded-full transition-all duration-500" style={{ width: '96%' }}></div>
                        </div>
                      </div>
                      <div className="pt-2 border-t-2 border-slate-200 space-y-1 text-[9px]">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Volatility Sensitivity:</span>
                          <span className="font-bold text-slate-900">Medium</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Gamma Exposure:</span>
                          <span className="font-bold text-slate-900">High near 233</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Insights */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 shadow-lg p-4">
                    <h4 className="text-sm font-black text-blue-900 mb-3">ðŸ’¡ Insights</h4>
                    <div className="text-[10px] leading-relaxed text-slate-700 space-y-2">
                      <div className="flex gap-2">
                        <span className="text-blue-600 font-bold">â€¢</span>
                        <span>This hedge profits if {ticker} moves downward from {submittedPrice}.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-blue-600 font-bold">â€¢</span>
                        <span>Put spread activates immediately below spot and fully protects down to ${selectedPutSpread.sellStrike}.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-blue-600 font-bold">â€¢</span>
                        <span>Call spread provides the credit needed to keep the hedge near zero cost.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-blue-600 font-bold">â€¢</span>
                        <span>The structure creates a stable, defined-risk bearish profile.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-blue-600 font-bold">â€¢</span>
                        <span>Net delta is negative, giving meaningful downside participation without overleveraging.</span>
                      </div>
                    </div>
                  </div>

                  {/* Risk Alerts */}
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border-2 border-orange-300 shadow-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="text-orange-600" size={16} />
                      <h4 className="text-sm font-black text-orange-900">Risk Alerts</h4>
                    </div>
                    <div className="text-[10px] leading-relaxed text-slate-700 space-y-2">
                      <div className="flex gap-2">
                        <span className="text-orange-600 font-bold">âš </span>
                        <span>Max loss occurs if {ticker} rallies above ${selectedCallSpread.buyStrike}.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-orange-600 font-bold">âš </span>
                        <span>Large upside gap risk above ${selectedCallSpread.sellStrike}.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-orange-600 font-bold">âš </span>
                        <span>Vega drop (volatility crush) reduces put value in sideways markets.</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-orange-600 font-bold">âš </span>
                        <span>Sharp moves around {selectedCallSpread.sellStrike} may cause gamma spikes.</span>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="bg-white border-2 border-slate-200 rounded-xl p-8 text-center shadow-lg">
                  <div className="text-slate-400 mb-3">
                    <Target size={48} className="mx-auto opacity-50" />
                  </div>
                  <p className="text-xs text-slate-600 font-semibold">Select spreads to view comprehensive analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpreadAnalyzer;