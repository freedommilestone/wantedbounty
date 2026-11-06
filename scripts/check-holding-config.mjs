// Production-only, read-only release checks. Never log credentials or RPC URLs.
if(process.env.VERCEL_ENV==='production'){
 const {historyRpc,historyStart}=await import('../server/holding-history.js');
 const {BERI_MINT,walletDb}=await import('../server/wallet-verification.js');
 let stage='server configuration';
 try{
  for(const name of ['SUPABASE_URL','SUPABASE_SECRET_KEY','SOLANA_HISTORY_RPC_URL','CRON_SECRET'])if(!process.env[name]?.trim())throw new Error('Missing configuration');
  historyStart();
  stage='Supabase energy and wallet migrations';
  await Promise.all(['player_energy','energy_levels','energy_events','wallet_links','wallet_holding_history'].map(table=>walletDb(`${table}?select=*&limit=0`)));
  stage='historical RPC and token launch coverage';
  const first=await historyRpc('getTransactionsForAddress',[BERI_MINT,{transactionDetails:'signatures',sortOrder:'asc',limit:1,commitment:'finalized',filters:{status:'succeeded'}}]);
  if(!Number.isSafeInteger(first?.data?.[0]?.slot)||first.data[0].slot<111491819)throw new Error('Unsupported history');
  stage='full token-account history support';
  const page=await historyRpc('getTransactionsForAddress',[BERI_MINT,{transactionDetails:'full',encoding:'json',maxSupportedTransactionVersion:1,commitment:'finalized',sortOrder:'asc',limit:1,filters:{status:'succeeded',tokenAccounts:'all',slot:{gte:first.data[0].slot}}}]);
  if(!Array.isArray(page?.data)||!page.data.length||!Number.isSafeInteger(page.data[0].transactionIndex)||!Array.isArray(page.data[0].meta?.preTokenBalances))throw new Error('Unsupported history response');
  console.log('Production checks passed: Supabase energy/wallet tables, finalized history RPC, token-launch coverage, full token-account metadata.');
 }catch{
  console.error(`Production release check failed: ${stage}. Check the server-only Vercel configuration/provider access.`);
  process.exitCode=1;
 }
}
