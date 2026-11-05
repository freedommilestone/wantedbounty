import test from 'node:test';
import assert from 'node:assert/strict';
import {requireAccount,authorizeOrder} from '../server/account-auth.js';
const req={headers:{authorization:'Bearer signed-session'}};
function env(t){for(const key of ['SUPABASE_URL','SUPABASE_SECRET_KEY']){const old=process.env[key];process.env[key]=key==='SUPABASE_URL'?'https://test.supabase.co':'secret';t.after(()=>{if(old===undefined)delete process.env[key];else process.env[key]=old;});}}
test('missing login is rejected without contacting storage',async()=>{await assert.rejects(requireAccount({headers:{}}),e=>e.status===401);});
test('expired or forged login is rejected by Supabase',async t=>{env(t);t.mock.method(globalThis,'fetch',async()=>new Response(null,{status:401}));await assert.rejects(requireAccount(req),e=>e.status===401);});
test('unconfirmed email cannot prepare a paid order',async t=>{env(t);t.mock.method(globalThis,'fetch',async()=>Response.json({id:'a'}));await assert.rejects(requireAccount(req),e=>e.status===401);});
test('account identity comes from Supabase, never user metadata',async t=>{env(t);t.mock.method(globalThis,'fetch',async(url,opts)=>{assert.match(url,/auth\/v1\/user$/);assert.equal(opts.headers.Authorization,req.headers.authorization);return Response.json({id:'a',email_confirmed_at:'2026-11-05',user_metadata:{id:'b'}});});assert.equal(await requireAccount(req),'a');await authorizeOrder(req,{details:{accountId:'a'}});await assert.rejects(authorizeOrder(req,{details:{accountId:'b'}}),e=>e.status===403);});
test('legacy orders keep recovery-token access',async()=>{await authorizeOrder({headers:{}},{details:{}});});
