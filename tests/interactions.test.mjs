import test from 'node:test';
import assert from 'node:assert/strict';
import { createKeyboardScope, createRovingFocus } from '../dist/esm/index.js';

test('roving focus skips disabled items and loops over enabled items', () => {
  const focus = createRovingFocus(['a', 'b', 'c'], { loop: true });
  focus.setDisabled(['b']);
  assert.equal(focus.active(), 'a');
  assert.equal(focus.move('ArrowRight'), 'c');
  assert.equal(focus.move('ArrowRight'), 'a');
  assert.deepEqual(focus.snapshot(), { items: ['a', 'b', 'c'], disabled: ['b'], active: 'a' });
});

test('orientation, home/end, replacement and snapshots are explicit', () => {
  const focus = createRovingFocus(['a', 'b', 'c'], { orientation: 'vertical' });
  assert.equal(focus.move('ArrowLeft'), 'a');
  assert.equal(focus.move('End'), 'c');
  focus.replaceItems(['b', 'd']);
  assert.equal(focus.active(), 'b');
  const snapshot = focus.snapshot();
  snapshot.items.pop();
  assert.deepEqual(focus.snapshot().items, ['b', 'd']);
});

test('keyboard scope dispatch requires exact scope and does not dispatch while composing', () => {
  const calls = [];
  const scope = createKeyboardScope('menu', { Escape: (input) => calls.push(input) });
  assert.equal(scope.dispatch({ key: 'Escape', scope: 'other' }), false);
  assert.equal(scope.dispatch({ key: 'Escape', scope: 'menu', composing: true }), false);
  assert.equal(scope.dispatch({ key: 'Escape', scope: 'menu' }), true);
  assert.equal(calls[0].scope, 'menu');
  assert.ok(Object.isFrozen(calls[0]));
});

test('invalid inputs do not mutate focus state', () => {
  const focus = createRovingFocus(['a', 'b']);
  assert.throws(() => focus.setDisabled(['unknown']), TypeError);
  assert.throws(() => focus.replaceItems(['x', 'x']), /Duplicate/);
  assert.throws(() => focus.focus('missing'), /Unknown/);
  assert.throws(() => focus.move('Enter'), /Unsupported focus key/);
  assert.throws(() => createKeyboardScope('x', { Enter: null }), TypeError);
  assert.deepEqual(focus.snapshot(), { items: ['a', 'b'], disabled: [], active: 'a' });
});

test('disabled and empty groups produce null focus safely', () => {
  const focus = createRovingFocus(['a']);
  focus.setDisabled(['a']);
  assert.equal(focus.move('Home'), null);
  focus.replaceItems([]);
  assert.equal(focus.snapshot().active, null);
});
