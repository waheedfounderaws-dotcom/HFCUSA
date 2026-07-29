// High-Performance Simulation Engine running in Web Worker
// Handles 3000+ traders, stock prices, transaction logging, and referral network calculations

// Universal Deterministic Price Calculation
// Guaranteed identical across all global clients and web workers for any specific timestamp
function getUniversalPrice(symbol, timestampMs = Date.now()) {
  const isGold = symbol ? (symbol.startsWith('XAU') || symbol === 'XAU') : true;
  const basePrice = 69000.00;
  const scale = isGold ? 1.0 : 32.0;
  
  const t = timestampMs / 1000.0;
  
  // 1. Macro Swings (Multi-day & Daily trends)
  const macro1 = Math.sin(t / (11.5 * 86400) * 2 * Math.PI) * (45.0 * scale);
  const macro2 = Math.sin(t / (4.2 * 86400) * 2 * Math.PI + 1.8) * (28.0 * scale);
  const daily  = Math.cos(t / (1.3 * 86400) * 2 * Math.PI + 4.2) * (18.0 * scale);
  
  // 2. Intermediate Swings (4-Hour & 1-Hour waves)
  const h4     = Math.sin(t / (6.8 * 3600) * 2 * Math.PI + 0.9) * (12.0 * scale);
  const h1     = Math.cos(t / (2.4 * 3600) * 2 * Math.PI + 2.5) * (7.5 * scale);
  
  // 3. Intraday Trends (15m to 30m continuity)
  const m30    = Math.sin(t / (52.0 * 60) * 2 * Math.PI + 5.1) * (4.2 * scale);
  const m15    = Math.cos(t / (19.0 * 60) * 2 * Math.PI + 3.7) * (2.4 * scale);
  
  // 4. Micro Candlestick Movements (1m & 5m real-world oscillations)
  const m5     = Math.sin(t / (7.2 * 60) * 2 * Math.PI + 1.2) * (1.3 * scale);
  const m1     = Math.cos(t / (2.8 * 60) * 2 * Math.PI + 0.4) * (0.65 * scale);
  
  // 5. Live Tick Jitters (Seconds-level micro ticks)
  const secW   = Math.sin(t / 28.0 * 2 * Math.PI) * (0.22 * scale);
  const tickSlot = Math.floor(t * 1.5);
  const seedNoise = Math.sin(tickSlot * (isGold ? 171.171 : 313.313)) * 43758.5453;
  const tickNoise = (seedNoise - Math.floor(seedNoise) - 0.5) * (0.18 * scale);
  
  const price = basePrice + macro1 + macro2 + daily + h4 + h1 + m30 + m15 + m5 + m1 + secW + tickNoise;
  return Number(price.toFixed(2));
}

// Initial Stock Configurations
const nowTsInit = Date.now();
let stocks = [
  { symbol: 'XAU', name: 'Gold / USD', price: getUniversalPrice('XAU', nowTsInit), history: [], volatility: 0.0001, drift: 0 },
  { symbol: 'BTC', name: 'Bitcoin / USD', price: getUniversalPrice('BTC', nowTsInit), history: [], volatility: 0.0005, drift: 0 },
  { symbol: 'ETH', name: 'Ethereum / USD', price: getUniversalPrice('ETH', nowTsInit), history: [], volatility: 0.0005, drift: 0 },
  { symbol: 'EUR', name: 'EUR / USD', price: getUniversalPrice('EUR', nowTsInit), history: [], volatility: 0.0001, drift: 0 },
  { symbol: 'GBP', name: 'GBP / USD', price: getUniversalPrice('GBP', nowTsInit), history: [], volatility: 0.0001, drift: 0 }
];

// Initialize histories deterministically
stocks.forEach(stock => {
  for (let i = 59; i >= 0; i--) {
    const p = getUniversalPrice(stock.symbol, nowTsInit - (i * 1000));
    stock.history.push(Number(p.toFixed(2)));
  }
  stock.price = stock.history[stock.history.length - 1] || getUniversalPrice(stock.symbol, nowTsInit);
});

// Realistic culturally-matched name profiles for authentic leaderboards
const NAME_PROFILES = [
  {
    weight: 45, // 45% Pakistani / South Asian Traders
    firsts: ['Ahmad', 'Ali', 'Bilal', 'Usman', 'Hamza', 'Imran', 'Talha', 'Faizan', 'Shahzad', 'Arsalan', 'Zeeshan', 'Saad', 'Faisal', 'Naveed', 'Kashif', 'Zain', 'Danish', 'Sheraz', 'Zainab', 'Fatima', 'Ayesha', 'Sana', 'Sadia', 'Hira', 'Mariam', 'Anum'],
    lasts: ['Khan', 'Malik', 'Iqbal', 'Ahmed', 'Raza', 'Butt', 'Dar', 'Ramzan', 'Sheikh', 'Qureshi', 'Chaudhry', 'Alvi', 'Gill', 'Mughal', 'Bhatti', 'Shah', 'Farooq', 'Siddiqui', 'Memon']
  },
  {
    weight: 35, // 35% English / Western Traders
    firsts: ['John', 'Robert', 'David', 'Michael', 'James', 'William', 'Thomas', 'Charles', 'Daniel', 'Matthew', 'Christopher', 'Richard', 'Joseph', 'Sarah', 'Emily', 'Jessica', 'Mary', 'Jennifer', 'Elizabeth', 'Linda', 'Susan', 'Barbara', 'Chloe'],
    lasts: ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Thompson', 'White', 'Harris', 'Clark', 'Walker']
  },
  {
    weight: 10, // 10% Arabic / Middle Eastern Traders
    firsts: ['Omar', 'Tariq', 'Hassan', 'Khalid', 'Faisal', 'Zaid', 'Yousef', 'Rashed', 'Noor', 'Layla', 'Reem', 'Yasmin'],
    lasts: ['Al-Farsi', 'Al-Mansoor', 'Al-Sayed', 'Al-Hashimi', 'Al-Maktoum', 'Al-Sabah', 'Othman', 'Husseini']
  },
  {
    weight: 6, // 6% Chinese / East Asian Traders
    firsts: ['Li', 'Wei', 'Min', 'Jian', 'Jun', 'Chen', 'Xiaoli', 'Mei'],
    lasts: ['Wang', 'Zhang', 'Chen', 'Liu', 'Zhao', 'Wu', 'Huang', 'Yang']
  },
  {
    weight: 4, // 4% European / Hispanic Traders
    firsts: ['Mateo', 'Lucas', 'Gabriel', 'Elena', 'Sofia', 'Dmitry', 'Ivan'],
    lasts: ['Rodriguez', 'Martinez', 'Perez', 'Sanchez', 'Garcia', 'Petrov', 'Ivanov', 'Smirnov']
  }
];

function generateRealisticName() {
  const totalWeight = NAME_PROFILES.reduce((sum, p) => sum + p.weight, 0);
  let r = Math.random() * totalWeight;
  let selected = NAME_PROFILES[0];
  for (const profile of NAME_PROFILES) {
    if (r < profile.weight) {
      selected = profile;
      break;
    }
    r -= profile.weight;
  }
  const fName = selected.firsts[Math.floor(Math.random() * selected.firsts.length)];
  const lName = selected.lasts[Math.floor(Math.random() * selected.lasts.length)];
  return `${fName} ${lName}`;
}

// Strategies list
const STRATEGIES = ['day_trader', 'hodler', 'whale', 'value_investor', 'panic_seller'];

// Simulated Traders
let traders = [];
const TOTAL_TRADERS = 3120; // 3000+ traders
let userTrader = {
  id: 525810,
  name: 'Rashida parv',
  profilePic: '',
  strategy: 'user',
  balance: 0.00,
  unclaimedRebate: 0,
  claimedRebate: 0,
  holdings: { XAU: 0, BTC: 0 },
  betRecords: [],
  transactions: [], // Recharge/Withdrawal records
  openPositions: [], // MT5 Margin Trades
  pendingOrders: [], // MT5 Pending Orders
  equity: 0.00,
  freeMargin: 0.00,
  marginUsed: 0,
  leverage: 500, // 1:500 leverage
  rebateRate: 10, // Default Rebate amount per standard lot (1.00)
  netWorth: 0.00,
  initialNetWorth: 0.00,
  pnl: 0,
  tradesCount: 0,
  isTeamMember: false,
  referrerId: null
};

// Generate AI Traders
function initializeTraders() {
  traders = [userTrader];
  
  for (let i = 1; i < TOTAL_TRADERS; i++) {
    const name = generateRealisticName();
    const id = 500000 + i;
    
    // Distribute strategy
    const strategy = STRATEGIES[Math.floor(Math.random() * STRATEGIES.length)];
    
    // Balance range based on strategy (strictly within $10k for realistic trading accounts)
    let balance = 0;
    if (strategy === 'whale') {
      balance = Math.floor(Math.random() * 4800) + 5000 + (Math.random() * 0.99); // Whales have $5,000 - $9,800
    } else {
      balance = Math.floor(Math.random() * 4500) + 250 + (Math.random() * 0.99); // Others have $250 - $4,750
    }
    
    // Holdings initialization
    let holdings = { XAU: 0, BTC: 0 };
    
    // Give some initial positions
    stocks.forEach(stock => {
      if (Math.random() > 0.6) {
        let shares = (Math.random() * (balance / 3)) / stock.price;
        holdings[stock.symbol] = Number(shares.toFixed(4));
        balance -= holdings[stock.symbol] * stock.price;
      }
    });

    // Check if team member of user (about 150 team members)
    // Team members will be flagged so we can list them and earn commissions from them
    const isTeamMember = i <= 150; 
    
    const initialNetWorth = balance + Object.keys(holdings).reduce((sum, symbol) => {
      const stock = stocks.find(s => s.symbol === symbol);
      return sum + (holdings[symbol] * stock.price);
    }, 0);

    traders.push({
      id,
      name,
      strategy,
      balance: Number(balance.toFixed(2)),
      holdings,
      netWorth: Number(initialNetWorth.toFixed(2)),
      initialNetWorth: Number(initialNetWorth.toFixed(2)),
      pnl: 0,
      isTeamMember: isTeamMember,
      referrerId: isTeamMember && userTrader ? userTrader.id : null,
      tradesCount: 10
    });
  }
}

initializeTraders();

// Transaction queue for recently executed trades
let transactions = [];
const MAX_TRANSACTIONS = 20;

// Market Shock states
let marketEvent = null;
let eventTimer = 0;
let customNewsFeed = []; // Store permanent custom news

let supportTickets = [
  { id: 102, user: 'Ahsan_crypto', issue: 'My deposit of 50 USDT is not showing in wallet.', status: 'Open', time: Date.now() - 600000 },
  { id: 103, user: 'Muneeb_pro', issue: 'I forgot my transaction PIN.', status: 'Open', time: Date.now() - 1800000 },
  { id: 98, user: 'Sara_112', issue: 'Chart is loading slow on mobile data.', status: 'Closed', time: Date.now() - 7200000 },
];

// Cumulative Team earnings
let totalCommissionEarned = 0.00;
let teamTradingVolume = 0.00;

// Simulation Speed config
let tickDuration = 300; // ms
let isPaused = false;
let globalTradeCount = 14582; // Start from an active market count
let totalRebateGenerated = 0;
let totalSpreadCollected = 0;
let rebateHistory = [];
let activeBinaryBets = [];

let todayTradesCount = 0;
let todayBuyCount = 0;
let todaySellCount = 0;
let todayClientLoss = 0;
let todayClientProfit = 0;
let currentDayStr = new Date().toDateString();

// Leaderboard cache
let leaderboard = [];

// Helper to push transactions
function addTransaction(trader, type, symbol, qty, price) {
  const value = qty * price;
  globalTradeCount++; // Keep global trade count for fake UI activity
  
  if (trader === userTrader) {
      todayTradesCount++;
      if (type === 'BUY') todayBuyCount++;
      if (type === 'SELL') {
        todaySellCount++;
        // PnL for spot trades is theoretically calculated when closing positions
        // We will just estimate PnL here since spot trades don't have explicit win/lose until closing with average price tracking.
        // For simplicity, we just track the PnL when a real user settles a trade (binary bets) or closes a position.
      }
  }

  // Calculate commission if trader is in the user's team
  let commission = 0;
  if (trader.isTeamMember && userTrader && trader.referrerId === userTrader.id) {
    commission = Number((value * 0.001).toFixed(4)); // 0.1% commission
    totalCommissionEarned += commission;
    teamTradingVolume += value;
    
    // Note: Commission is tracked in totalCommissionEarned but no longer 
    // automatically added to the user's main trading balance to prevent auto-inflation.
  }

  // Rebate Logic for Spot Trades
  let rebateRate = trader.rebateRate || 0;
  if (rebateRate > 0) {
      let lot = symbol === 'XAU' ? qty / 100 : qty;
      let rebate = Number((lot * rebateRate).toFixed(4));
      
      if (rebate > 0) {
          totalRebateGenerated += rebate;
          if (userTrader && trader.referrerId === userTrader.id) {
              // Route to human user's unclaimedRebate (as referrer)
              userTrader.unclaimedRebate = Number(((userTrader.unclaimedRebate || 0) + rebate).toFixed(4));
              rebateHistory.unshift({ id: trader.id, name: trader.name, lot: lot, rebate: rebate, time: Date.now() });
          } else {
              // Route to self (for standalone AI traders without a referrer)
              trader.balance = Number((trader.balance + rebate).toFixed(4));
              // Don't show non-team AI rebates in user's history
          }
          if (rebateHistory.length > 50) rebateHistory.pop();
      }
  }

  const tx = {
    id: 'tx-' + Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
    traderName: trader.name,
    traderId: trader.id,
    isTeamMember: trader.isTeamMember,
    type, // 'BUY' or 'SELL'
    symbol,
    qty: Number(qty.toFixed(symbol === 'BTC' || symbol === 'ETH' ? 4 : 0)),
    price: Number(price.toFixed(2)),
    value: Number(value.toFixed(2)),
    commission: commission
  };

  transactions.unshift(tx);
  if (transactions.length > MAX_TRANSACTIONS) {
    transactions.pop();
  }
}

// Function to update stock prices (Geometric Brownian Motion + shocks)
function updateStockPrices() {
  let shockDriftMultiplier = 1.0;
  let shockVolMultiplier = 1.0;

  if (marketEvent) {
    eventTimer--;
    if (eventTimer <= 0) {
      marketEvent = null;
    } else {
      if (marketEvent.type === 'CRASH') {
        shockDriftMultiplier = -8.0;
        shockVolMultiplier = 2.0;
      } else if (marketEvent.type === 'BULL') {
        shockDriftMultiplier = 6.0;
        shockVolMultiplier = 1.5;
      } else if (marketEvent.type === 'CRYPTO_HYP') {
        // Crypto goes up, stocks normal
        shockDriftMultiplier = 1.0;
      }
    }
  }

  const currentHour = new Date().getHours();
  let timeMultiplier = 1.0;
  
  // New York Session Overlap (17 to 21)
  if (currentHour >= 17 && currentHour <= 21) {
      timeMultiplier = 2.5; // High volatility
  } 
  // Asian Session (2 to 11)
  else if (currentHour >= 2 && currentHour <= 11) {
      timeMultiplier = 0.3; // Low volatility
  }

  const currentTimestamp = Date.now();
  stocks.forEach(stock => {
    let price = getUniversalPrice(stock.symbol, currentTimestamp);

    // ── Dealing Desk House Advantage (Market Maker Technique) ──
    // Jis taraf zada bet volume ho, wo side lose ho jayegi aur kam volume wali side win karegi
    if (typeof activeBinaryBets !== 'undefined' && activeBinaryBets.length > 0) {
      const symPrefix = stock.symbol.split('/')[0];
      const relBets = activeBinaryBets.filter(b => {
        if (!b.symbol || !b.symbol.startsWith(symPrefix)) return false;
        const dMs = (b.tfs || 60) * 1000;
        const bucketEndTs = b.targetCloseTs ? b.targetCloseTs : (Math.floor(b.placedTs / dMs) * dMs + dMs);
        const sLeft = Math.max(0, Math.floor((bucketEndTs - currentTimestamp) / 1000));
        const lockThresh = (b.tfs || 60) >= 300 ? 60 : ((b.tfs || 60) <= 60 ? 15 : Math.min(60, Math.floor((b.tfs || 60) / 4)));
        return sLeft <= lockThresh; // Only manipulate price during the final locked decision period!
      });
      if (relBets.length > 0) {
        let totalRise = 0, totalFall = 0, minEntry = Infinity, maxEntry = -Infinity;
        relBets.forEach(b => {
          if (b.type === 'Rise' || b.type === 'BUY') totalRise += b.amount;
          else if (b.type === 'Fall' || b.type === 'SELL') totalFall += b.amount;
          if (b.entryPrice < minEntry) minEntry = b.entryPrice;
          if (b.entryPrice > maxEntry) maxEntry = b.entryPrice;
        });
        const scale = symPrefix === 'XAU' ? 1.0 : 32.0;
        const timeOffset = Math.sin(currentTimestamp / 350) * (0.10 * scale);
        if (totalRise > totalFall && totalRise > 0) {
          // Majority volume on Rise -> Force price below lowest entry (ALL Rise lose, ANY Fall win)
          const targetDrop = minEntry - (0.35 * scale) + timeOffset;
          if (price >= targetDrop) price = targetDrop;
        } else if (totalFall > totalRise && totalFall > 0) {
          // Majority volume on Fall -> Force price above highest entry (ALL Fall lose, ANY Rise win)
          const targetRise = maxEntry + (0.35 * scale) + timeOffset;
          if (price <= targetRise) price = targetRise;
        }
      }
    }

    stock.price = Number(price.toFixed(2));
    stock.history.push(stock.price);
    if (stock.history.length > 40) {
      stock.history.shift();
    }
  });
}

// Evaluate and run trading logic for a subset of AI traders
function processAITraders() {
  // Process about 120 random AI traders per tick to keep load 0%
  const batchSize = 120;
  const startIndex = Math.floor(Math.random() * (traders.length - batchSize - 1)) + 1; // skip user (index 0)

  for (let i = startIndex; i < startIndex + batchSize; i++) {
    const trader = traders[i];
    if (!trader || (userTrader && trader.id.toString() === userTrader.id.toString())) continue; // skip user

    // Strategy parameters
    let buyThreshold = 0.01;
    let sellThreshold = 0.01;
    let tradeProbability = 0.08; // 8% chance to trade in this tick

    if (trader.strategy === 'day_trader') {
      tradeProbability = 0.25; // day traders trade very often
    } else if (trader.strategy === 'hodler') {
      tradeProbability = 0.01; // hodlers rarely trade
    } else if (trader.strategy === 'whale') {
      tradeProbability = 0.05;
    }

    if (Math.random() > tradeProbability) continue;

    // Pick a random stock to analyze
    const stock = stocks[Math.floor(Math.random() * stocks.length)];
    const price = stock.price;
    const history = stock.history;
    
    if (history.length < 5) continue;
    
    const prevPrice = history[history.length - 2];
    const priceChangeRatio = (price - prevPrice) / prevPrice;

    // Simple strategy decisions
    let action = null; // 'BUY', 'SELL' or null
    let amount = 0;

    switch (trader.strategy) {
      case 'day_trader':
        // Momentum: buy if rising, sell if falling
        if (priceChangeRatio > 0.005 && trader.balance > 10) {
          action = 'BUY';
          amount = trader.balance * (Math.random() * 0.4 + 0.1); // 10% to 50% of balance
        } else if (priceChangeRatio < -0.005) {
          action = 'SELL';
          amount = (trader.holdings[stock.symbol] || 0) * (Math.random() * 0.6 + 0.4); // sell 40%-100% of holdings
        }
        break;

      case 'hodler':
        // Buy deep dips only
        if (priceChangeRatio < -0.04 && trader.balance > 20) {
          action = 'BUY';
          amount = trader.balance * 0.5; // buy heavily on dips
        } else {
          // Sell only if profit is high (simulated as small chance if price hits historical high)
          const maxHist = Math.max(...history);
          if (price >= maxHist && (trader.holdings[stock.symbol] > 0) && Math.random() > 0.95) {
            action = 'SELL';
            amount = trader.holdings[stock.symbol] * 0.2; // sell 20%
          }
        }
        break;

      case 'whale':
        // Make huge trades randomly
        const whaleHoldings = trader.holdings[stock.symbol] || 0;
        if (Math.random() > 0.5 && trader.balance > 50000) {
          action = 'BUY';
          amount = trader.balance * (Math.random() * 0.3 + 0.1); // Buy $10k - $150k
        } else if (whaleHoldings > 0) {
          action = 'SELL';
          amount = whaleHoldings * (Math.random() * 0.4 + 0.1);
        }
        break;

      case 'value_investor':
        // Buy below moving average, sell above
        const avg = history.reduce((a, b) => a + b, 0) / history.length;
        if (price < avg * 0.98 && trader.balance > 50) {
          action = 'BUY';
          amount = trader.balance * 0.3;
        } else if (price > avg * 1.02 && (trader.holdings[stock.symbol] > 0)) {
          action = 'SELL';
          amount = trader.holdings[stock.symbol] * 0.4;
        }
        break;

      case 'panic_seller':
        // Sells heavily during any down-tick, buys on upticks
        if (priceChangeRatio < -0.015 && (trader.holdings[stock.symbol] > 0)) {
          action = 'SELL';
          amount = trader.holdings[stock.symbol]; // Dump everything!
        } else if (priceChangeRatio > 0.02 && trader.balance > 20) {
          action = 'BUY';
          amount = trader.balance * 0.4;
        }
        break;
    }

    // Execute the Action
    if (action === 'BUY' && amount > 5) {
      const qty = amount / price;
      trader.balance = Number((trader.balance - amount).toFixed(2));
      trader.holdings[stock.symbol] = Number(((trader.holdings[stock.symbol] || 0) + qty).toFixed(4));
      trader.tradesCount++;
      addTransaction(trader, 'BUY', stock.symbol, qty, price);

      // Whales impact stock price slightly
      if (trader.strategy === 'whale') {
        stock.price *= 1.00001; // +0.001% price impact
      }
    } else if (action === 'SELL' && amount > 0) {
      const qty = amount;
      const val = qty * price;
      trader.holdings[stock.symbol] = Number(((trader.holdings[stock.symbol] || 0) - qty).toFixed(4));
      trader.balance = Number((trader.balance + val).toFixed(2));
      trader.tradesCount++;
      addTransaction(trader, 'SELL', stock.symbol, qty, price);

      // Whales impact stock price slightly
      if (trader.strategy === 'whale') {
        stock.price *= 0.99999; // -0.001% price impact
      }
    }
  }
}

// Calculate Net Worth for all traders, and process MT5 logic for User
function updateTradersNetWorth() {
  traders.forEach(trader => {
    let holdingsValue = 0;
    Object.keys(trader.holdings).forEach(symbol => {
      const stock = stocks.find(s => s.symbol === symbol);
      if (stock) {
        holdingsValue += trader.holdings[symbol] * stock.price;
      }
    });

    let floatingPnL = 0;
    
    // MT5 logic for userTrader
    if (userTrader && trader.id.toString() === userTrader.id.toString()) {
      // 1. Check Pending Orders
      const executed = [];
      trader.pendingOrders = trader.pendingOrders.filter(order => {
         const stock = stocks.find(s => s.symbol === order.symbol);
         if (!stock) return false; // Cancel if invalid
         
         let hit = false;
         if (order.type === 'Buy Limit' && stock.price <= order.targetPrice) hit = true;
         if (order.type === 'Buy Stop' && stock.price >= order.targetPrice) hit = true;
         if (order.type === 'Sell Limit' && stock.price >= order.targetPrice) hit = true;
         if (order.type === 'Sell Stop' && stock.price <= order.targetPrice) hit = true;
         
         if (hit) {
            const spread = order.symbol === 'XAU' ? 0.30 : 20.00;
            totalSpreadCollected += spread * order.volume * 100;
            executed.push({
               id: Date.now() + Math.random(),
               symbol: order.symbol,
               type: order.type.startsWith('Buy') ? 'BUY' : 'SELL',
               volume: order.volume,
               entryPrice: stock.price, // Executed at market price
               margin: order.margin,
               spreadCost: spread * order.volume * 100
            });
            return false; // Remove from pending
         }
         return true; // Keep pending
      });
      
      // Move executed to open positions
      if (executed.length > 0) {
         trader.openPositions.push(...executed);
      }

      // 2. Calculate Floating PnL and Check TP/SL
      let marginUsed = 0;
      trader.openPositions = trader.openPositions.filter(pos => {
         const stock = stocks.find(s => s.symbol === pos.symbol);
         if (!stock) return true;
         
         let pnl = 0;
         const CONTRACT_SIZE = 100;
         const spread = pos.symbol === 'XAU' ? 0.30 : 20.00;
         const currentPrice = pos.type === 'BUY' ? stock.price : stock.price + spread;
         
         if (pos.type === 'BUY') {
            pnl = (currentPrice - pos.entryPrice) * pos.volume * CONTRACT_SIZE;
         } else {
            pnl = (pos.entryPrice - currentPrice) * pos.volume * CONTRACT_SIZE;
         }
         
         // Check TP / SL
         let hitTP = pos.tp && ((pos.type === 'BUY' && currentPrice >= pos.tp) || (pos.type === 'SELL' && currentPrice <= pos.tp));
         let hitSL = pos.sl && ((pos.type === 'BUY' && currentPrice <= pos.sl) || (pos.type === 'SELL' && currentPrice >= pos.sl));
         
         if (hitTP || hitSL) {
             // Settle trade
             let rebate = Number((pos.volume * (trader.rebateRate || 0)).toFixed(2));
             totalRebateGenerated += rebate;
             if (userTrader && trader.id.toString() === userTrader.id.toString()) {
                 trader.balance = Number((trader.balance + pnl).toFixed(4));
                 // Note: We DO NOT add rebate to userTrader.unclaimedRebate anymore.
             } else {
                 if (rebate > 0 && userTrader && trader.referrerId === userTrader.id) {
                     userTrader.unclaimedRebate = Number(((userTrader.unclaimedRebate || 0) + rebate).toFixed(4));
                     rebateHistory.unshift({ id: trader.id, name: trader.name, lot: pos.volume, rebate: rebate, time: Date.now() });
                     if (rebateHistory.length > 50) rebateHistory.pop();
                 }
                 trader.balance = Number((trader.balance + pnl + rebate).toFixed(4));
             }
             
             trader.betRecords.unshift({
                ...pos,
                closePrice: currentPrice,
                closeTime: Date.now(),
                pnl: Number(pnl.toFixed(4)),
                rebate: rebate,
                reason: hitTP ? 'TP Hit' : 'SL Hit'
             });
            if (trader.betRecords.length > 50) trader.betRecords.pop();

            // Trigger notification & Save to DB
            if (userTrader && trader.id.toString() === userTrader.id.toString()) {
               self.postMessage({ type: 'DB_SAVE_TRADE', payload: { trade: trader.betRecords[0] } });
               postMessage({ 
                 type: 'MARGIN_ALERT_EVENT', 
                 payload: { title: 'Position Closed', desc: `Trade ${pos.type} ${pos.symbol} closed at ${hitTP ? 'TP' : 'SL'}. PnL: $${pnl.toFixed(2)}` }
               });
            }
            return false; // Remove from openPositions
         }
         
         pos.currentPrice = currentPrice;
         pos.pnl = Number(pnl.toFixed(4));
         floatingPnL += pos.pnl;
         marginUsed += pos.margin;
         return true;
      });
      
      trader.marginUsed = Number(marginUsed.toFixed(2));
      trader.equity = Number((trader.balance + floatingPnL).toFixed(2));
      
      // ── MARGIN CALL / LIQUIDATION LOGIC ──
      if (trader.equity <= 0 && trader.openPositions.length > 0) {
         let totalRebate = 0;
         // Add liquidated positions to history
         trader.openPositions.forEach(pos => {
            const stock = stocks.find(s => s.symbol === pos.symbol);
            let pnl = 0;
            let currentPrice = stock ? stock.price : pos.entryPrice;
            const CONTRACT_SIZE = 100;
            
            if (pos.type === 'BUY') {
                pnl = (currentPrice - pos.entryPrice) * pos.volume * CONTRACT_SIZE;
            } else {
                pnl = (pos.entryPrice - currentPrice) * pos.volume * CONTRACT_SIZE;
            }
            let rebate = Number((pos.volume * (trader.rebateRate || 0)).toFixed(2));
            totalRebate += rebate;
            totalRebateGenerated += rebate;
            if (rebate > 0 && userTrader && trader.referrerId === userTrader.id) {
                rebateHistory.unshift({ id: trader.id, name: trader.name, lot: pos.volume, rebate: rebate, time: Date.now() });
                if (rebateHistory.length > 50) rebateHistory.pop();
            }

            const closedRecord = {
               ...pos,
               closePrice: currentPrice,
               closeTime: Date.now(),
               pnl: Number(pnl.toFixed(4)),
               rebate: rebate,
               reason: 'Liquidated'
            };
            trader.betRecords.unshift(closedRecord);
            if (userTrader && trader.id.toString() === userTrader.id.toString()) {
               self.postMessage({ type: 'DB_SAVE_TRADE', payload: { trade: closedRecord } });
            }
         });
         
         if (trader.betRecords.length > 50) {
            trader.betRecords = trader.betRecords.slice(0, 50);
         }

         trader.balance = Number(totalRebate.toFixed(4));
         trader.equity = Number(totalRebate.toFixed(4));
         trader.marginUsed = 0;
         trader.openPositions = [];
         trader.pendingOrders = [];
         
         // Trigger MARGIN CALL UI Event only for real user
         if (userTrader && trader.id.toString() === userTrader.id.toString()) {
            postMessage({ type: 'MARGIN_CALL_EVENT', payload: { equity: trader.equity } });
         }
      }
         
      trader.freeMargin = Number((trader.equity - trader.marginUsed).toFixed(2));
    }

    const previousNetWorth = trader.netWorth;
    // For standard AI/Spot trades, netWorth is balance + holdings. 
    // For user, add floating PnL.
    trader.netWorth = Number((trader.balance + holdingsValue + floatingPnL).toFixed(2));
    
    // PNL relative to start of simulator
    trader.pnl = Number((((trader.netWorth - trader.initialNetWorth) / trader.initialNetWorth) * 100).toFixed(2));
  });
}

// Compute Leaderboard and user rank
function calculateLeaderboard() {
  // Sort copy of traders by net worth descending
  const sorted = [...traders].sort((a, b) => b.netWorth - a.netWorth);
  
  // Find User's Rank
  const userRankIndex = sorted.findIndex(t => userTrader && t.id.toString() === userTrader.id.toString());
  userTrader.rank = userRankIndex + 1;

  // Cache top 10 traders
  leaderboard = sorted.slice(0, 50).map((t, index) => ({
    rank: index + 1,
    id: t.id,
    name: t.name,
    strategy: t.strategy,
    netWorth: t.netWorth,
    pnl: t.pnl,
    isTeamMember: t.isTeamMember,
    rebateRate: t.rebateRate || 0
  }));
}

// Main Simulation Tick Function
function tick() {
  if (isPaused) return;

  // 1. Update prices
  updateStockPrices();

  // 2. Process AI trades
  processAITraders();

  // 3. Update Net worth values
  updateTradersNetWorth();

  // 4. Calculate stats
  calculateLeaderboard();

  // 5. Send state updates to main UI
  sendStateUpdate();
}

// Package and send standard state updates to the main thread
function sendStateUpdate() {
  const nowDayStr = new Date().toDateString();
  if (nowDayStr !== currentDayStr) {
    currentDayStr = nowDayStr;
    todayTradesCount = 0;
    todayBuyCount = 0;
    todaySellCount = 0;
    todayClientLoss = 0;
    todayClientProfit = 0;
  }

  // Global stats
  const totalMarketCap = stocks.reduce((sum, s) => sum + (s.price * 2500000), 0); // Mock circulating supply
  
  // Sentiment check: ratio of buys to sells in recent transactions
  let buyCount = 0;
  transactions.forEach(t => { if (t.type === 'BUY') buyCount++; });
  const sentiment = transactions.length > 0 ? Math.round((buyCount / transactions.length) * 100) : 50;

  postMessage({
    type: 'STATE_UPDATE',
    data: {
      timestamp: Date.now(),
      stocks: stocks.map(s => ({
        symbol: s.symbol,
        name: s.name,
        price: Number(s.price.toFixed(2)),
        history: s.history,
        volatility: s.volatility,
        dailyChange: Number((((s.price - s.history[0]) / s.history[0]) * 100).toFixed(2))
      })),
      leaderboard,
      recentTrades: transactions,
      activeTrades: traders.flatMap(t => (t.openPositions || []).map(p => ({ ...p, traderId: t.id, traderName: t.name }))),
      marketEvent,
      customNews: customNewsFeed,
      supportTickets,
      globalStats: {
        totalTraders: traders.length,
        globalTradeCount,
        sentiment,
        totalMarketCap: Number(totalMarketCap.toFixed(0)),
        teamVolume: Number(teamTradingVolume.toFixed(2)),
        totalCommissionEarned: Number(totalCommissionEarned.toFixed(4)),
        totalRebateGenerated: Number(totalRebateGenerated.toFixed(4)),
        totalSpreadCollected: Number(totalSpreadCollected.toFixed(4)),
        rebateHistory: rebateHistory,
        todayTradesCount,
        todayBuyCount,
        todaySellCount,
        todayClientLoss,
        todayClientProfit
      },
      userState: {
        id: userTrader.id,
        name: userTrader.name,
        profilePic: userTrader.profilePic,
        balance: Number(userTrader.balance.toFixed(2)),
        walletChangeAccess: userTrader.walletChangeAccess,
        unclaimedRebate: Number((userTrader.unclaimedRebate || 0).toFixed(4)),
        claimedRebate: Number((userTrader.claimedRebate || 0).toFixed(4)),
        holdings: userTrader.holdings,
        betRecords: userTrader.betRecords,
        transactions: userTrader.transactions,
        openPositions: userTrader.openPositions,
        pendingOrders: userTrader.pendingOrders,
        equity: userTrader.equity,
        freeMargin: userTrader.freeMargin,
        marginUsed: userTrader.marginUsed,
        leverage: userTrader.leverage,
        netWorth: Number(userTrader.netWorth.toFixed(2)),
        pnl: userTrader.pnl,
        rank: userTrader.rank || 3012,
        tradesCount: userTrader.tradesCount,
        rebateRate: userTrader.rebateRate || 0,
        winRate: userTrader.winRate || 0,
        followers: userTrader.followers || 0,
        phone: userTrader.phone || '',
        referralCode: userTrader.referralCode || ''
      },
      marketEvent
    }
  });
}

// Timer for the simulation
let simInterval = setInterval(tick, tickDuration);

// Sync daily stats to backend every 10 seconds
setInterval(() => {
  self.postMessage({ type: 'DB_SAVE_DAILY_STATS', payload: {
     dateStr: new Date().toDateString(),
     stats: {
        todayTradesCount,
        todayBuyCount,
        todaySellCount,
        todayClientLoss,
        todayClientProfit
     }
  }});
}, 10000);

// Search, Sort and Filter execution (performed in worker to prevent UI freeze on 3000+ items)
function handleSearch(searchQuery, sortBy, pageNum, pageSize, filterType) {
  let filtered = [...traders];

  // 1. Filter by search query (id or name)
  if (searchQuery) {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(query) || 
      t.id.toString().includes(query)
    );
  }

  // 2. Filter by Team or Strategy Type
  if (filterType === 'team') {
    filtered = filtered.filter(t => t.isTeamMember);
  } else if (filterType && filterType !== 'all') {
    filtered = filtered.filter(t => t.strategy === filterType);
  }

  // 3. Sorting
  if (sortBy === 'netWorth') {
    filtered.sort((a, b) => b.netWorth - a.netWorth);
  } else if (sortBy === 'pnl') {
    filtered.sort((a, b) => b.pnl - a.pnl);
  } else if (sortBy === 'tradesCount') {
    filtered.sort((a, b) => b.tradesCount - a.tradesCount);
  } else if (sortBy === 'id') {
    filtered.sort((a, b) => a.id - b.id);
  }

  // 4. Pagination
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIdx = (pageNum - 1) * pageSize;
  const paginatedItems = filtered.slice(startIdx, startIdx + pageSize).map((t, idx) => ({
    rank: traders.slice().sort((a, b) => b.netWorth - a.netWorth).findIndex(item => item.id === t.id) + 1,
    id: t.id,
    name: t.name,
    strategy: t.strategy,
    balance: t.balance,
    holdings: t.holdings,
    netWorth: t.netWorth,
    pnl: t.pnl,
    tradesCount: t.tradesCount,
    isTeamMember: t.isTeamMember
  }));

  postMessage({
    type: 'SEARCH_RESULTS',
    data: {
      items: paginatedItems,
      totalPages,
      totalItems,
      currentPage: pageNum
    }
  });
}

// Event listener for messages from main thread
onmessage = function(e) {
  const { type, payload } = e.data;

  switch (type) {
    case 'SYNC_ACTIVE_BETS':
      activeBinaryBets = payload || [];
      break;

    case 'CHANGE_NAME':
      if (payload.name !== undefined) {
        userTrader.name = payload.name;
      }
      if (payload.profilePic !== undefined) {
        userTrader.profilePic = payload.profilePic;
      }
      sendStateUpdate();
      break;

    case 'UPDATE_WITHDRAWAL_ADDRESS':
      if (payload.withdrawalAddress !== undefined) {
        userTrader.withdrawalAddress = payload.withdrawalAddress;
      }
      if (payload.walletChangeAccess !== undefined) {
        userTrader.walletChangeAccess = payload.walletChangeAccess;
      }
      sendStateUpdate();
      break;

    case 'USER_TRADE':
      const { stockSymbol, buyOrSell, qty } = payload;
      const targetStock = stocks.find(s => s.symbol === stockSymbol);
      if (!targetStock) return;
      
      const tradeValue = qty * targetStock.price;

      if (buyOrSell === 'BUY') {
        if (userTrader.balance >= tradeValue) {
          userTrader.balance -= tradeValue;
          userTrader.holdings[stockSymbol] = Number(((userTrader.holdings[stockSymbol] || 0) + qty).toFixed(4));
          userTrader.tradesCount++;
          // Apply user price impact (tiny)
          targetStock.price *= 1.0005;
          addTransaction(userTrader, 'BUY', stockSymbol, qty, targetStock.price);
        }
      } else {
        const ownedQty = userTrader.holdings[stockSymbol] || 0;
        if (ownedQty >= qty) {
          userTrader.holdings[stockSymbol] = Number((ownedQty - qty).toFixed(4));
          userTrader.balance += tradeValue;
          userTrader.tradesCount++;
          // Apply user price impact (tiny)
          targetStock.price *= 0.9995;
          addTransaction(userTrader, 'SELL', stockSymbol, qty, targetStock.price);
        }
      }
      updateTradersNetWorth();
      calculateLeaderboard();
      sendStateUpdate();
      break;

    case 'USER_BET_SETTLE': {
      const { profit, record } = payload;
      userTrader.balance = Math.max(0, Number((userTrader.balance + profit).toFixed(4)));
      if (record) {
        userTrader.betRecords.unshift(record);
        if (userTrader.betRecords.length > 50) userTrader.betRecords.pop();
        
        todayTradesCount++;
        if (record.type === 'Rise' || record.type === 'BUY') todayBuyCount++;
        else todaySellCount++;

        if (profit > 0) {
           todayClientProfit += (profit - record.amount);
        } else if (profit === 0 && record.pnl < 0) {
           todayClientLoss += Math.abs(record.pnl);
        }
        
        // Sync to backend
        self.postMessage({ type: 'DB_SAVE_TRADE', payload: { trade: userTrader.betRecords[0] } });
      }
      updateTradersNetWorth();
      calculateLeaderboard();
      sendStateUpdate();
      break;
    }

    case 'MARGIN_MARKET_ORDER': {
      const { symbol, type, volume, tp, sl } = payload; // type: 'BUY' or 'SELL'
      const stock = stocks.find(s => s.symbol === symbol);
      if (!stock) break;
      
      const CONTRACT_SIZE = 100;
      const spread = symbol === 'XAU' ? 0.30 : 20.00;
      const entryPrice = type === 'BUY' ? stock.price + spread : stock.price;

      const marginRequired = (entryPrice * volume * CONTRACT_SIZE) / userTrader.leverage;
      if (userTrader.freeMargin >= marginRequired) {
         totalSpreadCollected += spread * volume * CONTRACT_SIZE;
         userTrader.openPositions.push({
            id: Date.now() + Math.random(),
            symbol,
            type,
            volume,
            entryPrice: entryPrice,
            margin: marginRequired,
            pnl: 0,
            currentPrice: type === 'BUY' ? stock.price : stock.price + spread,
            tp,
            sl,
            spreadCost: spread * volume * CONTRACT_SIZE
         });
         updateTradersNetWorth();
         sendStateUpdate();
      }
      break;
    }

    case 'MARGIN_PENDING_ORDER': {
      const { symbol, type, volume, targetPrice, tp, sl } = payload; 
      const stock = stocks.find(s => s.symbol === symbol);
      if (!stock) break;

      const CONTRACT_SIZE = 100;
      const marginRequired = (targetPrice * volume * CONTRACT_SIZE) / userTrader.leverage;
      if (userTrader.freeMargin >= marginRequired) {
         userTrader.pendingOrders.push({
            id: Date.now() + Math.random(),
            symbol,
            type, // 'BUY Limit', 'SELL Stop', etc.
            volume,
            targetPrice,
            margin: marginRequired,
            tp,
            sl
         });
         updateTradersNetWorth();
         sendStateUpdate();
      }
      break;
    }

    case 'MARGIN_CLOSE_POSITION': {
      const { id } = payload;
      const idx = userTrader.openPositions.findIndex(p => p.id === id);
      if (idx !== -1) {
         const pos = userTrader.openPositions[idx];
         // Realize PnL and generate Rebate for Referrer
         let rebate = Number((pos.volume * (userTrader.rebateRate || 0)).toFixed(2));
         totalRebateGenerated += rebate;
         // Note: We DO NOT add rebate to userTrader.unclaimedRebate anymore.
         // It is assigned to their referrer in the backend DB upon /api/trades/close.
         userTrader.balance = Number((userTrader.balance + pos.pnl).toFixed(4));
         
         userTrader.betRecords.unshift({
            ...pos,
            closePrice: pos.currentPrice,
            closeTime: Date.now(),
            rebate: rebate,
            reason: 'Manual Close'
         });
         if (userTrader.betRecords.length > 50) userTrader.betRecords.pop();

         // Send to App.jsx for DB persistence
         self.postMessage({ type: 'DB_SAVE_TRADE', payload: { trade: userTrader.betRecords[0] } });

         userTrader.openPositions.splice(idx, 1);
         updateTradersNetWorth();
         sendStateUpdate();
      }
      break;
    }

    case 'MARGIN_CANCEL_ORDER': {
      const { id } = payload;
      const idx = userTrader.pendingOrders.findIndex(p => p.id === id);
      if (idx !== -1) {
         userTrader.pendingOrders.splice(idx, 1);
         updateTradersNetWorth();
         sendStateUpdate();
      }
      break;
    }

    case 'USER_TOPUP': {
      const topUpAmount = payload.amount;
      userTrader.balance = Number((userTrader.balance + topUpAmount).toFixed(2));
      
      if (topUpAmount > 0) {
         userTrader.transactions.unshift({
            id: 'RC' + Math.floor(1000 + Math.random() * 9000),
            date: new Date().toLocaleString(),
            amount: topUpAmount,
            status: 'Confirmed',
            method: payload.method || 'USDT TRC-20',
            txHash: 'Tx' + Math.random().toString(16).substring(2, 10),
            type: 'Deposit'
         });
         if (userTrader.transactions.length > 50) userTrader.transactions.pop();
      }

      updateTradersNetWorth();
      calculateLeaderboard();
      sendStateUpdate();
      break;
    }

    case 'USER_WITHDRAW': {
      const withdrawAmount = payload.amount;
      if (userTrader.balance >= withdrawAmount) {
        userTrader.balance = Number((userTrader.balance - withdrawAmount).toFixed(2));
        
        if (withdrawAmount > 0) {
           const txId = 'WD' + Math.floor(1000 + Math.random() * 9000);
           userTrader.transactions.unshift({
              id: txId,
              date: new Date().toLocaleString(),
              amount: -withdrawAmount,
              status: 'Pending',
              method: payload.method || 'USDT TRC-20',
              txHash: 'Tx' + Math.random().toString(16).substring(2, 10),
              type: 'Withdrawal'
           });
           
           // Simulate blockchain/admin confirmation delay (10 seconds)
           setTimeout(() => {
              const tx = userTrader.transactions.find(t => t.id === txId);
              if (tx) {
                 tx.status = 'Confirmed';
                 sendStateUpdate();
              }
           }, 10000);

           if (userTrader.transactions.length > 50) userTrader.transactions.pop();
        }

        updateTradersNetWorth();
        calculateLeaderboard();
        sendStateUpdate();
      }
      break;
    }

    case 'USER_TRANSFER': {
      const { transferAmount } = payload;
      if (userTrader.balance >= transferAmount) {
        userTrader.balance = Number((userTrader.balance - transferAmount).toFixed(2));
        updateTradersNetWorth();
        calculateLeaderboard();
        sendStateUpdate();
      }
      break;
    }

    case 'TRIGGER_SHOCK':
      const { eventType } = payload;
      eventTimer = 40; // shock lasts 40 ticks
      if (eventType === 'CRASH') {
        marketEvent = { type: 'CRASH', title: 'Market Crash! 🔴', desc: 'Fears of global economic slowdown trigger panic selloffs.' };
      } else if (eventType === 'BULL') {
        marketEvent = { type: 'BULL', title: 'Bull Run! 🟢', desc: 'Positive corporate reports spark strong buying momentum.' };
      } else if (eventType === 'CRYPTO_HYP') {
        marketEvent = { type: 'CRYPTO_HYP', title: 'Crypto Hype! ⚡', desc: 'Major institutional inflows send Bitcoin soaring.' };
      }
      tick(); // Trigger immediately
      break;

    case 'CHANGE_SPEED':
      tickDuration = payload.speed;
      clearInterval(simInterval);
      if (!isPaused) {
        simInterval = setInterval(tick, tickDuration);
      }
      break;

    case 'PAUSE_SIM':
      isPaused = payload.pause;
      if (isPaused) {
        clearInterval(simInterval);
      } else {
        clearInterval(simInterval);
        simInterval = setInterval(tick, tickDuration);
      }
      break;

    case 'ADMIN_CHART_CONTROL': {
      const { symbol, targetPrice, forcedTrend, targetDuration } = payload;
      const stock = stocks.find(s => s.symbol === symbol);
      if (stock) {
        if (targetPrice !== undefined) {
            stock.targetPrice = targetPrice;
            stock.targetDurationTicks = targetDuration ? Math.floor((targetDuration * 1000) / tickDuration) : undefined;
        }
        if (forcedTrend !== undefined) {
            stock.forcedTrend = forcedTrend;
            if (targetPrice === undefined && targetDuration) {
                stock.trendDurationTicks = Math.floor((targetDuration * 1000) / tickDuration);
            } else if (forcedTrend === 'NORMAL') {
                stock.trendDurationTicks = undefined;
            }
        }
      }
      sendStateUpdate();
      break;
    }

    case 'SEARCH_TRADERS':
      const { searchQuery, sortBy, pageNum, pageSize, filterType } = payload;
      handleSearch(searchQuery, sortBy, pageNum, pageSize, filterType);
      break;



    case 'SYNC_DB_REBATE': {
      if (userTrader) {
          userTrader.unclaimedRebate = payload.unclaimedRebate;
          userTrader.claimedRebate = payload.claimedRebate;
          sendStateUpdate();
      }
      break;
    }

    case 'SYNC_DB_REBATE_HISTORY': {
      if (payload.history) {
          // Replace local rebateHistory with DB history, as the DB is the source of truth for the user's team rebates
          rebateHistory = payload.history;
          sendStateUpdate();
      }
      break;
    }

    case 'SYNC_DB_TRADES': {
      if (userTrader) {
          const dbTrades = payload.trades || [];
          
          if (dbTrades.length > 0) {
              // Convert DB Trade format to UI format
              const formattedTrades = dbTrades.map(t => ({
                  id: t.id,
                  symbol: t.symbol,
                  type: t.type,
                  volume: t.volume,
                  entryPrice: t.entryPrice,
                  closePrice: t.closePrice,
                  pnl: t.pnl,
                  rebate: t.rebate,
                  reason: t.reason,
                  timestamp: t.openTime,
                  closeTime: t.closeTime
              }));
              
              // Combine and strictly deduplicate by ID and fingerprint so duplicate or combined trades never stack up
              const combined = [...formattedTrades, ...userTrader.betRecords];
              const uniqueMap = new Map();
              combined.forEach(t => {
                  const key = t.id ? String(t.id) : `${t.symbol}_${t.entryPrice}_${t.closePrice}_${t.closeTime}`;
                  if (!uniqueMap.has(key)) uniqueMap.set(key, t);
              });
              
              userTrader.betRecords = Array.from(uniqueMap.values());
              userTrader.betRecords.sort((a, b) => new Date(b.closeTime) - new Date(a.closeTime));
              
              if (userTrader.betRecords.length > 100) userTrader.betRecords.length = 100; // Limit history
              
              sendStateUpdate();
          }
      }
      break;
    }

    case 'LOGOUT_USER': {
      if (userTrader) {
        userTrader.betRecords = [];
        userTrader.transactions = [];
        userTrader.openPositions = [];
        userTrader.pendingOrders = [];
        sendStateUpdate();
      }
      break;
    }

    case 'SYNC_DB_BALANCE': {
      if (typeof payload.balance === 'number') {
        userTrader.balance = payload.balance;
        updateTradersNetWorth();
        sendStateUpdate();
      }
      break;
    }

    case 'LOGIN_USER': {
      userTrader = {
        id: payload.id,
        name: payload.name || payload.nickname,
        profilePic: payload.avatar || payload.profilePic || '',
        strategy: 'user',
        balance: payload.balance || 0,
        unclaimedRebate: payload.unclaimedRebate || 0,
        claimedRebate: payload.claimedRebate || 0,
        holdings: payload.holdings || { XAU: 0, BTC: 0 },
        betRecords: payload.betRecords || [],
        transactions: payload.transactions || [],
        openPositions: payload.openPositions || [],
        pendingOrders: payload.pendingOrders || [],
        equity: payload.equity || payload.balance || 0,
        freeMargin: payload.freeMargin || payload.balance || 0,
        marginUsed: payload.marginUsed || 0,
        leverage: payload.leverage || 500,
        rebateRate: payload.rebateRate || 10,
        netWorth: payload.netWorth || payload.balance || 0,
        initialNetWorth: payload.initialNetWorth || payload.balance || 0,
        pnl: payload.pnl || 0,
        tradesCount: payload.tradesCount || 0,
        winRate: payload.winRate || 0,
        followers: payload.followers || 0,
        phone: payload.phone || '',
        referralCode: payload.referralCode || '',
        isTeamMember: false,
        referrerId: payload.referredBy || null,
        role: payload.role || 'user',
        permissions: payload.permissions || [],
        withdrawalAddress: payload.withdrawalAddress || '',
        walletChangeAccess: payload.walletChangeAccess || false
      };
      
      // Update the userTrader reference inside traders array
      traders[0] = userTrader;
      
      // Reset support tickets for new user
      supportTickets = [
        { id: 102, user: 'Ahsan_crypto', issue: 'My deposit of 50 USDT is not showing in wallet.', status: 'Open', time: Date.now() - 600000 },
        { id: 103, user: 'Muneeb_pro', issue: 'I forgot my transaction PIN.', status: 'Open', time: Date.now() - 1800000 },
        { id: 98, user: 'Sara_112', issue: 'Chart is loading slow on mobile data.', status: 'Closed', time: Date.now() - 7200000 },
      ];
      
      sendStateUpdate();
      break;
    }

    case 'HYDRATE_TICKETS':
      if (payload && Array.isArray(payload)) {
        supportTickets = payload;
        sendStateUpdate();
      }
      break;

    case 'HYDRATE_DAILY_STATS':
      if (payload && payload.dateStr === currentDayStr) {
        todayTradesCount = payload.todayTradesCount || 0;
        todayBuyCount = payload.todayBuyCount || 0;
        todaySellCount = payload.todaySellCount || 0;
        todayClientLoss = payload.todayClientLoss || 0;
        todayClientProfit = payload.todayClientProfit || 0;
      }
      break;

    case 'SYNC_DB_BALANCE': {
      const { amount, overrideBalance } = payload;
      if (userTrader) {
        if (overrideBalance !== undefined) {
           userTrader.balance = overrideBalance;
           userTrader.netWorth = userTrader.balance + (userTrader.margin || 0);
        } else {
           userTrader.balance += amount;
           userTrader.netWorth = userTrader.balance + (userTrader.margin || 0);
        }
        sendStateUpdate();
      }
      break;
    }

    case 'TRIGGER_EVENT': {
      const { amount, overrideBalance } = payload;
      if (userTrader) {
        if (overrideBalance !== undefined) {
           userTrader.balance = overrideBalance;
           userTrader.netWorth = userTrader.balance + (userTrader.margin || 0);
        } else {
           userTrader.balance += amount;
           userTrader.netWorth += amount;
        }
        updateTradersNetWorth();
        calculateLeaderboard();
        sendStateUpdate();
      }
      break;
    }

    case 'SYNC_DB_GLOBAL_STATS': {
      totalRebateGenerated = payload.totalRebateGenerated || 0;
      totalSpreadCollected = payload.totalSpreadCollected || 0;
      sendStateUpdate();
      break;
    }

    case 'ADMIN_ADJUST_BALANCE': {
      const { userId, amount, isDeposit } = payload;
      const targetTrader = traders.find(t => t.id.toString() === userId.toString());
      if (targetTrader) {
        if (isDeposit) {
          targetTrader.balance += amount;
        } else {
          targetTrader.balance = Math.max(0, targetTrader.balance - amount);
        }
        targetTrader.netWorth = targetTrader.balance + (targetTrader.netWorth - targetTrader.balance); // Approximate update
        
        // Ensure the record shows up for the user
        if (targetTrader.id === userTrader.id) {
          userTrader.transactions.push({
            id: Date.now(),
            type: isDeposit ? 'DEPOSIT' : 'WITHDRAW',
            amount: isDeposit ? amount : -amount,
            method: 'Admin Bonus / Force Topup',
            date: new Date().toLocaleDateString(),
            timestamp: Date.now(),
            status: 'Confirmed',
            txHash: '0x' + Math.random().toString(16).slice(2, 10)
          });
        }
        
        updateTradersNetWorth();
        calculateLeaderboard();
        sendStateUpdate();
      }
      break;
    }

    case 'ADMIN_REMOVE_USER': {
      const { userId } = payload;
      const index = traders.findIndex(t => t.id === userId);
      if (index !== -1 && traders[index].id !== userTrader.id) {
        traders.splice(index, 1);
        calculateLeaderboard();
        sendStateUpdate();
      }
      break;
    }
    
    case 'USER_CLAIM_REBATE': {
      const amount = Math.min(payload.amount, userTrader.unclaimedRebate || 0);
      if (amount <= 0) break;
      
      userTrader.unclaimedRebate = Number((userTrader.unclaimedRebate - amount).toFixed(4));
      userTrader.claimedRebate = Number(((userTrader.claimedRebate || 0) + amount).toFixed(4));
      userTrader.balance = Number((userTrader.balance + amount).toFixed(4));
      
      userTrader.transactions.unshift({
          id: 'RBT' + Math.floor(1000 + Math.random() * 9000),
          date: new Date().toLocaleString(),
          amount: amount,
          type: 'REBATE CLAIM',
          status: 'Success'
      });
      updateTradersNetWorth();
      calculateLeaderboard();
      sendStateUpdate();
      break;
    }

    case 'ADMIN_SET_REBATE': {
      const { userId, rate } = payload;
      const targetTrader = traders.find(t => t.id === userId);
      if (targetTrader) {
        targetTrader.rebateRate = Number(rate) || 0;
      }
      sendStateUpdate();
      break;
    }

    case 'ADMIN_PUBLISH_NEWS': {
      const { title, desc } = payload;
      eventTimer = 30; // Custom news stays active for a bit in the ticker
      marketEvent = { type: 'CUSTOM', title, desc };
      
      // Also add it permanently to the custom news feed
      customNewsFeed.unshift({
        id: 'news-' + Date.now(),
        time: 'Just now',
        title: title,
        desc: desc,
        category: 'PLATFORM',
        impact: 'neutral'
      });
      
      sendStateUpdate();
      break;
    }

    case 'USER_SUBMIT_TICKET': {
      // Find existing open customer query for this user
      const existingTicket = supportTickets.find(t => t.user === userTrader.name && t.status === 'Open' && !t.isFinancial);

      if (existingTicket && !payload.isFinancial) {
        if (!existingTicket.replies) existingTicket.replies = [];
        existingTicket.replies.push({
          id: Date.now(),
          sender: payload.sender || 'user',
          text: payload.text,
          image: payload.image,
          time: Date.now()
        });
        sendStateUpdate();
        break;
      }

      const ticketId = Date.now();
      supportTickets.unshift({
        id: ticketId,
        user: userTrader.name,
        issue: payload.text,
        image: payload.image,
        replies: [],
        status: 'Open',
        time: Date.now(),
        isFinancial: payload.isFinancial,
        actionType: payload.actionType,
        amount: payload.amount
      });
      
      // If it's a financial request, add a 'Pending' transaction immediately
      if (payload.isFinancial) {
        userTrader.transactions.push({
          id: ticketId,
          type: payload.actionType,
          amount: payload.actionType === 'WITHDRAW' ? -payload.amount : payload.amount,
          method: payload.method || 'System',
          date: new Date().toLocaleDateString(),
          timestamp: Date.now(),
          status: 'Pending',
          txHash: '---'
        });
      }
      
      sendStateUpdate();
      break;
    }

    case 'ADMIN_REPLY_TICKET': {
      const ticket = supportTickets.find(t => t.id === payload.id);
      if (ticket && ticket.status === 'Open') {
        if (!ticket.replies) ticket.replies = [];
        ticket.replies.push({
          id: Date.now(),
          sender: 'admin',
          text: payload.text,
          time: Date.now()
        });
        sendStateUpdate();
      }
      break;
    }

    case 'ADMIN_RESOLVE_TICKET': {
      const ticket = supportTickets.find(t => t.id === payload.id);
      if (ticket && ticket.status === 'Open') {
        ticket.status = 'Closed';
        
        // If it's a financial request being approved, process the balance change
        if (ticket.isFinancial) {
           const tx = userTrader.transactions.find(t => t.id === ticket.id);
           
           if (payload.approve) {
             if (ticket.actionType === 'DEPOSIT') {
               userTrader.balance += ticket.amount;
             } else if (ticket.actionType === 'WITHDRAW') {
               userTrader.balance -= ticket.amount;
             }
             updateTradersNetWorth();
             
             if (tx) {
               tx.status = 'Confirmed';
               tx.txHash = '0x' + Math.random().toString(16).slice(2, 10);
             }
           } else {
             if (tx) {
               tx.status = 'Rejected';
             }
           }
        }
        
        sendStateUpdate();
      }
      break;
    }

    case 'REQUEST_REFRESH':
      sendStateUpdate();
      break;
  }
};
