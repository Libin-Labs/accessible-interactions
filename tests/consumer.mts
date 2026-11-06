import {
  createKeyboardScope,
  createRovingFocus,
  type FocusSnapshot,
  type KeyboardInput,
} from '@lp-labs/accessible-interactions';

const focus = createRovingFocus(['a', 'b']);
const snapshot: FocusSnapshot = focus.snapshot();
const input: KeyboardInput = { key: 'ArrowDown', scope: 'list' };
const scope = createKeyboardScope('list', { ArrowDown: () => focus.move('ArrowDown') });
const handled: boolean = scope.dispatch(input);
// @ts-expect-error Unknown items are not accepted as focus IDs.
focus.focus(12);
void [snapshot, handled];
