import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../server/handlers/sol-quote.js';

async function quote(t, replies, method = 'GET') {
 let calls = 0;
 t.mock.method(globalThis, 'fetch', async () => {
   const next = replies[calls++];
   if (next instanceof Error) throw next;
   return { ok: next.ok !== false, json: async () => next.data };
 });
 const res = { headers: {}, setHeader(k,v){this.headers[k]=v}, status(n){this.code=n;return this},json(body){this.body=body;return this} };
 await handler({method},res);
 return {...res,calls};
}
const primary = (price=100, age=0) => ({data:{solana:{usd:price,last_updated_at:(Date.now()-age)/1000}}});
const backup = (age=0) => ({data:{price:'125',time:new Date(Date.now()-age).toISOString()}});
test('fresh primary returns a $5 quote valid for 60 seconds',async t=>{
 const r=await quote(t,[primary()]);assert.equal(r.code,200);assert.equal(r.body.lamports,50000000);assert.equal(r.calls,1);assert.equal(r.headers['Cache-Control'],'no-store');assert.ok(r.body.expiresAt>Date.now()+59000);
});
for(const [label,failure] of [['rate limit',{ok:false}],['timeout',new Error('Timeout')],['malformed',{data:{}}],['stale',primary(100,400000)],['invalid price',primary(-1)]]){
 test(`${label} uses fresh backup`,async t=>{const r=await quote(t,[failure,backup()]);assert.equal(r.code,200);assert.equal(r.body.lamports,40000000);assert.equal(r.calls,2)});
}
test('both sources unavailable returns 503 with no amount',async t=>{const r=await quote(t,[{ok:false},backup(400000)]);assert.equal(r.code,503);assert.equal(r.body.lamports,undefined)});
test('future dated data is rejected',async t=>{const r=await quote(t,[primary(100,-60000),backup(-60000)]);assert.equal(r.code,503)});
test('non GET makes no price requests',async t=>{const r=await quote(t,[],'POST');assert.equal(r.code,405);assert.equal(r.calls,0)});
