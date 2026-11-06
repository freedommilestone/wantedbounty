import levels from './progression.json';
export const UNITS_PER_EP=86_400_000_000;
export type EnergyState={user_id:string;energy_units:number;highest_level:number;best_holding_days:number;capacity:number;legacy_ceiling_units?:number;ep_per_day:number;regen_eligible:boolean;eligible_until:string|null;last_holding_at:string|null;settled_at:string;revision:number};
export function projectedEnergy(state:EnergyState,now:number){
 const elapsed=state.regen_eligible?Math.max(0,Math.min(now,Date.parse(state.eligible_until||state.settled_at))-Date.parse(state.settled_at)):0;
 return Math.min(Math.max(state.capacity,state.energy_units/UNITS_PER_EP),(state.energy_units+elapsed*1000*state.ep_per_day)/UNITS_PER_EP);
}
export function nextEnergyLevel(state:EnergyState){return levels.find(l=>l.level===state.highest_level+1)??null;}
export {levels};
