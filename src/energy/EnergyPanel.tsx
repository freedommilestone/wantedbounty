'use client';
import {levels,nextEnergyLevel} from './model';
import type {useEnergy} from './useEnergy';
import './Energy.css';
export function EnergyPanel({energy}:{energy:ReturnType<typeof useEnergy>}){
 const {state,balance,now,error,loading,sync}=energy;
 const active=!!state?.regen_eligible&&!!state.eligible_until&&Date.parse(state.eligible_until)>now;
 const full=!!state&&balance!==null&&balance>=state.capacity;
 const next=state?nextEnergyLevel(state):null;
 return <section className="energy-panel" aria-label="Character energy progression">
  <header><h2>Character Energy</h2><span>{state?full?'Reserve full':active?'Regenerating':'Regeneration paused':'Loading reserve…'}</span></header>
  {state&&balance!==null&&<>
   <div className="energy-reserve"><strong>{Math.floor(balance).toLocaleString('en-US')} <small>/ {state.capacity.toLocaleString('en-US')} EP</small></strong><span>Level {state.highest_level} · Permanent</span></div>
   <progress aria-label="Energy reserve" value={balance} max={state.capacity}/>
   <div className="energy-facts"><p><strong>{(state.ep_per_day/24).toFixed(2)} EP/hour</strong><span>{state.ep_per_day} EP/day with at least 1 BERI</span></p><p><strong>{next?`Next: Level ${next.level}`:'Maximum level reached'}</strong><span>{next?`${state.best_holding_days.toLocaleString('en-US')} / ${next.holdingDays.toLocaleString('en-US')} best continuous holding days`:'All 100 levels unlocked'}</span></p></div>
   <p>{balance>state.capacity?'Your existing energy is preserved above the new cap. Regeneration resumes once your balance falls below the cap.':full?'Your reserve is full. Regeneration resumes after energy is spent.':active?'Energy accumulates automatically, including while you’re away.':state.last_holding_at?'Your saved energy and highest level are preserved. A qualifying verified wallet is needed to resume regeneration.':'Verify your wallet to activate eligible BERI holding progression.'}</p>
  </>}
  {error&&<p role="alert">{error} <button disabled={loading} onClick={()=>void sync()}>Retry</button></p>}
  <details><summary>View the 100-level progression</summary><div className="energy-table-scroll"><table><caption>Energy progression · Version 1.3</caption><thead><tr><th>Level</th><th>Holding days</th><th>EP/day</th><th>Max reserve</th></tr></thead><tbody>{levels.map(l=><tr key={l.level} className={l.level===state?.highest_level?'is-current':''}><td>{l.level}</td><td>{l.holdingDays.toLocaleString('en-US')}</td><td>{l.epPerDay}</td><td>{l.capacity.toLocaleString('en-US')}</td></tr>)}</tbody></table></div></details>
 </section>;
}
