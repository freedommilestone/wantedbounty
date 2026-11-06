import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import handler from '../server/handlers/energy.js';
const compiled=await build({entryPoints:['src/energy/model.ts'],bundle:true,write:false,platform:'node',format:'esm'});
const {projectedEnergy,UNITS_PER_EP,nextEnergyLevel}=await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
const levels=JSON.parse(await readFile(new URL('../src/energy/progression.json',import.meta.url)));
const start=Date.parse('2026-11-05T00:00:00Z');
const state={energy_units:0,highest_level:2,best_holding_days:1,capacity:528,ep_per_day:149,regen_eligible:true,eligible_until:new Date(start+86400000).toISOString(),settled_at:new Date(start).toISOString()};
test('all 100 PDF progression levels are increasing and match key milestones',()=>{
 assert.equal(levels.length,100);
 for(let i=0;i<100;i++){assert.equal(levels[i].level,i+1);if(i)assert(levels[i].holdingDays>levels[i-1].holdingDays&&levels[i].capacity>levels[i-1].capacity);}
 for(const [level,days,ep,cap] of [[1,0,144,500],[10,44,192,750],[25,203,264,1250],[50,614,384,2750],[75,1162,504,5000],[100,1825,624,10000]])assert.deepEqual(levels[level-1],{level,holdingDays:days,epPerDay:ep,capacity:cap});
});
test('live display preserves fractional accrual, clamps cap, respects pause and expiry',()=>{
 assert.equal(projectedEnergy(state,start+3600000),149/24);
 assert.equal(projectedEnergy(state,start+172800000),149);
 assert.equal(projectedEnergy({...state,regen_eligible:false},start+3600000),0);
 assert.equal(projectedEnergy({...state,energy_units:527*UNITS_PER_EP},start+3600000),528);
 assert.equal(projectedEnergy({...state,energy_units:8400*UNITS_PER_EP},start+3600000),8400);
 assert.equal(projectedEnergy(state,start-1000),0);
 assert.equal(nextEnergyLevel(state).holdingDays,4);assert.equal(nextEnergyLevel({...state,highest_level:100}),null);
});
function res(){return {code:0,body:null,setHeader(){},status(n){this.code=n;return this;},json(v){this.body=v;}};}
test('energy API cannot mutate balances through client-supplied spend/credit requests',async t=>{
 t.mock.method(globalThis,'fetch',()=>{throw new Error('Must not fetch');});
 const r=res();await handler({method:'POST',headers:{},body:{userId:'other',delta:999}},r);assert.equal(r.code,405);
 const anonymous=res();await handler({method:'GET',headers:{}},anonymous);assert.equal(anonymous.code,401);
});
test('energy sync uses authenticated identity, never an arbitrary query user',async t=>{
 for(const [key,value] of Object.entries({SUPABASE_URL:'https://energy-test.supabase.co',SUPABASE_SECRET_KEY:'server-secret'})){const before=process.env[key];process.env[key]=value;t.after(()=>before===undefined?delete process.env[key]:process.env[key]=before);}
 const requests=[];
 t.mock.method(globalThis,'fetch',async(url,options)=>{if(url.endsWith('/auth/v1/user'))return Response.json({id:'authenticated-player',email_confirmed_at:'2026-01-01'});requests.push(JSON.parse(options.body));return Response.json({...state,user_id:'authenticated-player'});});
 const r=res();await handler({method:'GET',headers:{authorization:'Bearer test'},query:{userId:'forged-player'}},r);
 assert.equal(r.code,200);assert.deepEqual(requests,[{p_user:'authenticated-player'}]);assert.equal(r.body.state.user_id,'authenticated-player');
});
