import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCeroBackup } from '../src/lib/backupValidation.js';
const sections = ['accounts','categories','transactions','budget_plans','recurring_transactions','savings_goals','goal_contributions','user_settings'];
const backup = version => ({format:'cero-backup',version,data:Object.fromEntries([...sections,...(version===2?['auto_sweep_decisions']:[])].map(key=>[key,[]]))});
test('accepts supported backup versions',()=>{assert.equal(validateCeroBackup(backup(1)),true);assert.equal(validateCeroBackup(backup(2)),true);});
test('rejects invalid backup envelopes and rows',()=>{for(const value of [null,undefined,{},backup(3)]) assert.throws(()=>validateCeroBackup(value),/not a supported/);const value=backup(2);value.data.accounts=[null];assert.throws(()=>validateCeroBackup(value),/invalid records/);});
