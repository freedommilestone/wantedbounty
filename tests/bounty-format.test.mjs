import {build} from 'esbuild';
import test from 'node:test';
import assert from 'node:assert/strict';
const bundled=await build({entryPoints:['src/bountyFormat.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {wholeBounty,wholeRawBalance}=await import('data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64'));
test('wallet display drops fractions without rounding up or losing large integer precision',()=>{
 assert.equal(wholeRawBalance(1250000999999n,6),'1,250,000');
 assert.equal(wholeRawBalance(999999n,6),'0');
 assert.equal(wholeRawBalance(123456789012345678901234n,6),'123,456,789,012,345,678');
});
test('poster display and recovered legacy orders drop decimals without multiplying the bounty',()=>{
 assert.equal(wholeBounty('1,250,000.85'),'1,250,000');
 assert.equal(wholeBounty(1250000.99),'1,250,000');
 assert.equal(wholeBounty('500,000,000'),'500,000,000');
});
