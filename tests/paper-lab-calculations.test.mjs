import test from 'node:test';
import assert from 'node:assert/strict';
import { paperQuote, paperBalance, sizing } from '../paper-lab/calculations.mjs';
test('93-cent quote: 10 contracts, no fees',()=>{const q=paperQuote(93,10);assert.ok(Math.abs(q.cost-9.3)<1e-9);assert.ok(Math.abs(q.gain-.7)<1e-9);assert.equal(q.breakEven,.93)});
test('fees reduce upside and raise break-even',()=>{const q=paperQuote(93,10,.2);assert.ok(Math.abs(q.cost-9.5)<1e-9);assert.ok(Math.abs(q.gain-.5)<1e-9);assert.equal(q.breakEven,.95)});
test('reject invalid quote inputs',()=>{for(const a of [[0,1],[100,1],[93,0],[93,1,-1],[93,1.5]])assert.throws(()=>paperQuote(...a),RangeError)});
test('open cost reserves balance, settled loss decreases it',()=>{const b=paperBalance([{status:'OPEN',cost:50},{status:'LOSS',cost:20,profit:-20}]);assert.deepEqual(b,{realized:-20,committed:50,available:330})});
test('sizing rounds down to whole contracts',()=>{const r=sizing(1,.93);assert.equal(r.contracts,4);assert.ok(r.cost<=4)});
