import React from 'react';
import CandlestickChart from './CandlestickChart';

export default function TransactionTerminal({ 
  state, 
  onNavigate, 
  onBetSettle,
  onMarginMarketOrder,
  onMarginPendingOrder,
  onMarginClosePosition,
  onMarginCancelOrder,
  globalActiveBets,
  setGlobalActiveBets
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      width: '100%',
      position: 'relative'
    }}>
      {/* We pass onNavigate('home') to onBack so if they click the back arrow in the chart header, it goes to Home */}
      <CandlestickChart 
        onBack={() => onNavigate('home')} 
        state={state} 
        onBetSettle={onBetSettle} 
        globalActiveBets={globalActiveBets}
        setGlobalActiveBets={setGlobalActiveBets}
        onMarginMarketOrder={onMarginMarketOrder}
        onMarginPendingOrder={onMarginPendingOrder}
        onMarginClosePosition={onMarginClosePosition}
        onMarginCancelOrder={onMarginCancelOrder}
      />
    </div>
  );
}
