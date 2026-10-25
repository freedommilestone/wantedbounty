import { build } from 'esbuild';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const result = await build({entryPoints:['src/payment.ts'],bundle:true,write:false,format:'esm',platform:'node',define:{'import.meta.env':'{}'}});
const {buildPosterPayment,PAYMENT_TOKENS,TREASURY_ADDRESS} = await import('data:text/javascript;base64,'+Buffer.from(result.outputFiles[0].text).toString('base64'));
const program = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
for (const token of ['USDC','USDT']) {
  for (const missing of [false,true]) {
    test(token+' fixed 5-token payment; treasury account missing='+missing, async()=>{
      const rpc=async(method,params)=>{
        if(method==='getTokenAccountsByOwner'){
          assert.equal(params[1].mint,PAYMENT_TOKENS[token]);
          return {value:[{pubkey:PAYMENT_TOKENS.USDC,account:{owner:program,data:{parsed:{info:{state:'initialized',tokenAmount:{amount:'5000000',decimals:6}}}}}}]};
        }
        if(method==='getAccountInfo') return {value:missing?null:{}};
        if(method==='getLatestBlockhash')return {value:{blockhash:TREASURY_ADDRESS}};
        throw Error(method);
      };
      const {transaction,createsTreasuryAccount}=await buildPosterPayment(rpc,{owner:TREASURY_ADDRESS,token});
      assert.equal(createsTreasuryAccount,missing);
      // Last instruction is TransferChecked: 5,000,000 base units, six decimals.
      assert.deepEqual([...transaction.slice(-10)],[12,64,75,76,0,0,0,0,0,6]);
      // Decode the legacy message and ensure the transfer targets the treasury ATA.
      let pos=65+3;
      const count=transaction[pos++];
      const keys=Array.from({length:count},()=>{const k=transaction.slice(pos,pos+32);pos+=32;return k;});
      pos+=32;
      assert.equal(transaction[pos++],missing?2:1);
      let last;
      for(let i=0;i<(missing?2:1);i++){
        const programIndex=transaction[pos++],n=transaction[pos++];
        const accounts=[...transaction.slice(pos,pos+n)];pos+=n;
        const len=transaction[pos++];pos+=len;
        last={programIndex,accounts};
      }
      assert.equal(last.accounts.length,4);
      assert.equal(last.accounts[3],0); // wallet must sign
      assert.notDeepEqual(keys[last.accounts[0]],keys[last.accounts[2]]);
    });
  }
  test(token+' insufficient funds stops before building transaction',async()=>{
    await assert.rejects(buildPosterPayment(async()=>({value:[]}),{owner:TREASURY_ADDRESS,token}),new RegExp('5 '+token));
  });
}
test('unsupported token rejected without RPC',async()=>{
  await assert.rejects(buildPosterPayment(()=>{throw Error('RPC should not run');},{owner:TREASURY_ADDRESS,token:'BERI'}),/Choose USDC or USDT/);
});
