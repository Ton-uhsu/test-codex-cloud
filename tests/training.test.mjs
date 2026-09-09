import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { workoutForDay } from '../lib/guide.mjs';
import { advanceSession } from '../lib/session.mjs';
import { TRAINING_KEY, emptyTraining, startTraining, recordSet, readTraining, writeTraining, setKey, lastResult } from '../lib/training.mjs';
import { createCadence, stepCadence, movementCues } from '../lib/cadence.mjs';
import { hasFollowMedia } from '../lib/follow-media.mjs';
const guide = JSON.parse(await readFile(new URL('../data/guide.json',import.meta.url)));
const w = workoutForDay(guide,1);
const store = () => { const map = new Map(); return {getItem:k=>map.get(k)||null, setItem:(k,v)=>map.set(k,v)}; };
test('a complete workout survives reloads and logs each actual set once', () => {
  const storage = store();
  let state = startTraining(emptyTraining(),w,'test-session',0);
  state.session = advanceSession(state.session,w,'ready',0);
  let now = 0;
  for (let i=0;i<10;i++) {
    const key = setKey(state.session);
    state = {...state,drafts:{[key]:{weight:'5',reps:'7'}}};
    assert.equal(writeTraining(storage,state),true);
    state = readTraining(storage,guide);
    assert.equal(state.drafts[key].reps,'7');
    const result = {weight:5,reps:7};
    state = recordSet(state,w,result,key,now);
    assert.equal(state.logs.length,i+1);
    assert.equal(recordSet(state,w,result,key,now),state);
    writeTraining(storage,state); state = readTraining(storage,guide);
    assert.equal(state.session.completedSets,i+1);
    if (i<9) {
      assert.equal(advanceSession(state.session,w,'continue',now).phase,'rest');
      now+=90000;
      state.session=advanceSession(state.session,w,'continue',now);
      assert.equal(state.session.phase,'exercise');
    }
  }
  assert.equal(state.session.phase,'done');
  assert.equal(state.logs.reduce((n,l)=>n+l.reps,0),70);
  assert.equal(lastResult(state.logs,w.exercises[4].id).weight,5);
  const next=startTraining(state,w,'second-session',now);
  assert.equal(next.logs.length,10); assert.equal(next.session.completedSets,0);
});
test('storage errors and malformed records fail safely; stale or invalid confirmation cannot advance',()=>{
  assert.deepEqual(readTraining({getItem:()=>'{oops'},guide),emptyTraining());
  assert.equal(writeTraining(null,emptyTraining()),false);
  assert.equal(writeTraining({setItem:()=>{throw Error('quota')}},emptyTraining()),false);
  let state=startTraining(emptyTraining(),w,'id',0);state.session=advanceSession(state.session,w,'ready',0);
  for(const result of [{weight:-1,reps:8},{weight:5,reps:1.5},{weight:NaN,reps:8}]) assert.equal(recordSet(state,w,result,setKey(state.session)),state);
  assert.equal(recordSet(state,w,{weight:5,reps:8},'old-session'),state);
  const storage=store();
  storage.setItem(TRAINING_KEY,JSON.stringify({...state,session:{...state.session,index:99}}));
  assert.deepEqual(readTraining(storage,guide),emptyTraining());
  assert.equal(recordSet(state,w,{weight:0,reps:0},setKey(state.session)).logs[0].reps,0);
});
test('every A/B movement has reviewed video or an explicitly labelled cadence coach',()=>{
  for(const workout of Object.values(guide.program.workouts)) for(const id of workout.exercises) assert.ok(hasFollowMedia(id)||movementCues[id],id);
});
test('cadence never catches up during stalled/background time and partial cycles restart',()=>{
  let s=stepCadence(createCadence(5),'start',0);
  for(let now=100;now<=5000;now+=100)s=stepCadence(s,'tick',now);
  assert.equal(s.phase,'playing');
  s=stepCadence(s,'tick',100000);
  assert.equal(s.phase,'paused'); assert.equal(s.count,0);
  s=stepCadence(s,'start',100000);
  for(let now=100100;now<=125000;now+=100)s=stepCadence(s,'tick',now);
  assert.equal(s.phase,'done'); assert.equal(s.count,5);
  assert.equal(stepCadence(s,'tick',1e9),s);
});
