// Kalshi read-only market discovery. Never submit orders or store credentials.
export const API='https://external-api.kalshi.com/trade-api/v2';
export function normalizeMarket(m){
 const ask=Number(m.yes_ask_dollars),noAsk=Number(m.no_ask_dollars);
 return {ticker:String(m.ticker||''),title:String(m.title||m.subtitle||''),status:String(m.status||''),closeTime:m.close_time||m.expected_expiration_time||null,yesAsk:Number.isFinite(ask)&&ask>0&&ask<1?ask:null,noAsk:Number.isFinite(noAsk)&&noAsk>0&&noAsk<1?noAsk:null,volume:m.volume_fp??null};
}
export async function loadMarkets(fetcher=fetch){
 const url=API+'/markets?series_ticker=KXBTC15M&status=open&limit=30';
 const response=await fetcher(url,{headers:{Accept:'application/json'},cache:'no-store'});
 if(!response.ok)throw new Error('Kalshi market feed unavailable ('+response.status+')');
 const data=await response.json();
 if(!Array.isArray(data.markets))throw new Error('Unexpected Kalshi response');
 return data.markets.map(normalizeMarket).filter(m=>m.ticker&&m.status==='open').sort((a,b)=>new Date(a.closeTime)-new Date(b.closeTime));
}
