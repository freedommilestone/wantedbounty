'use client';
import {useState} from 'react';
import {useAuth} from '../auth/AuthProvider';
import {useWallet,shortAddress} from '../wallet';
import {useVerifiedWallet} from './HoldingsProvider';
import {Link} from '../router';
export function WalletHoldingCard(){
 const {user}=useAuth(),{address,openModal}=useWallet(),{wallet,loading,busy,error,notice,verify,refresh,unlink,reload}=useVerifiedWallet();
 const [confirmUnlink,setConfirmUnlink]=useState(false);
 if(!user)return <section className="holding-card"><h2>Wallet Verification</h2><Link href="/account">Sign in to verify your wallet</Link></section>;
 return <section className="holding-card" aria-label="Wallet verification and holding streak"><header><h2>Wallet Verification</h2><span className={wallet?'holding-badge is-verified':'holding-badge'}>{loading?'Checking verification…':wallet?'✓ Ownership verified':'Not verified'}</span></header>
 {loading?<p role="status">Loading your wallet record…</p>:wallet?<>
  <p className="holding-wallet-address">Verified wallet <span title={wallet.address}>{shortAddress(wallet.address)}</span>{address&&address!==wallet.address&&<small>Your connected wallet is different. Tracking continues for your verified wallet.</small>}</p>
  <div className="holding-stat-grid"><div className="holding-total"><span>Total BERI holdings</span><strong>{wallet.balance??'—'} <small>BERI</small></strong></div><div><span>Current streak</span><strong>{wallet.historyCheckedAt?`${wallet.historicalCurrentDays} ${wallet.historicalCurrentDays===1?'day':'days'}`:'Checking…'}</strong></div><div><span>Best streak</span><strong>{wallet.historyCheckedAt?`${wallet.historicalBestDays} ${wallet.historicalBestDays===1?'day':'days'}`:'Checking…'}</strong></div></div>
  <p>Hold at least <strong>1 BERI</strong> to qualify. Historical streaks count complete 24-hour periods of uninterrupted holdings. Your saved wallet is checked automatically—no reconnection needed. Balances refresh every minute while this page is open; daily checks continue while you’re signed out.</p>
  <p className="holding-check-time">{wallet.lastCheckedAt?`Last checked: ${new Date(wallet.lastCheckedAt).toLocaleString()}`:'First balance check pending.'}{wallet.pending&&' Today’s check is pending.'}{wallet.checkFailed&&' The last check failed; no balance was assumed.'}</p>
  {wallet.historyStatus!=='complete'&&<p role="status">{wallet.historyStatus==='retrying'?'Historical holdings check is retrying. Your confirmed progress is preserved.':'Checking historical BERI holdings. Levels update after the history is verified.'}</p>}
  <div className="holding-actions"><button disabled={busy} onClick={()=>void refresh()}>{busy?'Please wait…':'Check Holdings'}</button><button className="holding-secondary" disabled={busy} onClick={()=>setConfirmUnlink(true)}>Unlink Wallet</button></div>
  {confirmUnlink&&<div className="holding-unlink" role="alert"><p>Unlinking pauses regeneration and removes this wallet’s tracking record. Your energy and permanent character level are preserved. Historical holdings are checked again when you verify a wallet.</p><button disabled={busy} onClick={()=>void unlink().then(()=>setConfirmUnlink(false))}>Unlink & Clear History</button><button disabled={busy} onClick={()=>setConfirmUnlink(false)}>Cancel</button></div>}
 </>:<><p>Connect your Solana wallet once, then sign a one-time message to prove ownership. We save your verified wallet to your account and check its BERI balance automatically. Verification is free and does not move funds.</p><p>Holding at least <strong>1 BERI</strong> qualifies for energy regeneration and holding progression. Each wallet can be linked to one account.</p><div className="holding-actions"><button disabled={busy} onClick={address?()=>void verify():openModal}>{busy?'Check your wallet…':address?'Verify Wallet & Start Tracking':'Connect Wallet'}</button></div></>}
 {error&&<p className="holding-error" role="alert">{error} <button disabled={busy||loading} onClick={()=>void reload()}>Reload Status</button></p>}{notice&&<p role="status">{notice}</p>}
 <small className="holding-method">Historical levels use finalized token-account transactions, reconciled against the wallet balance. A drop below 1 BERI breaks the streak. Regeneration follows automatic balance checks and pauses if checks expire.</small>
 </section>;
}
