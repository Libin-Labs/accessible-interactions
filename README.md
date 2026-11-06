# @lp-labs/accessible-interactions

Framework-neutral focus movement and keyboard routing primitives. They model state and dispatch
explicitly scoped input; they do not inspect or manipulate the DOM and do not guarantee that an
application is accessible. Runtime and peer dependencies: none.

## Install

```bash
npm install @lp-labs/accessible-interactions
```

Node 18+, strict TypeScript declarations, ESM and CommonJS builds.

## Quickstart

```js
import { createRovingFocus } from '@lp-labs/accessible-interactions';

const focus = createRovingFocus(['search', 'results', 'help'], {
  orientation: 'vertical',
  loop: true,
});
focus.setDisabled(['help']);
focus.move('ArrowDown');
if (focus.active() !== 'results') throw new Error('Unexpected focused item');
```

## Public APIs and types

- `createRovingFocus(items, options?)` creates bounded roving-focus state. `FocusOptions` supports
  `orientation` (`horizontal`, `vertical`, or `both`; default `both`), `loop` (default `false`),
  and `maxItems` (default 10,000). `RovingFocus` exposes `active`, `focus`, `move`, `setDisabled`,
  `replaceItems`, and `snapshot`. `FocusSnapshot` contains independent `items`, `disabled`, and
  `active` values. `FocusKey` and `FocusOrientation` describe accepted key/orientation values.
- `createKeyboardScope(id, bindings)` copies exact key-to-handler bindings. `KeyboardScope.id`
  identifies the scope; `dispatch(input)` calls a matching handler only when `input.scope` matches
  and composition is not active. `KeyboardInput` is `{ key, scope, repeat?, composing? }`.
  `KeyboardBindings` is a readonly mapping and `KeyboardHandler` receives a frozen input copy.
  The scope reports `repeat` but leaves repeated-key policy to the handler.

The only runtime exports are `createRovingFocus` and `createKeyboardScope`. No global key listeners,
event objects, focus calls, tab-index attributes, ARIA roles, editable-target detection, or modifier
key conventions are provided. Supply those through your UI adapter and validate them in the host
application. Arrow keys move one enabled item; Home/End select first/last enabled item.

## Customization

Map the UI event to this library's explicit scope and then render the returned active ID:

```js
import { createKeyboardScope, createRovingFocus } from '@lp-labs/accessible-interactions';

const focus = createRovingFocus(['one', 'two', 'three'], { orientation: 'vertical' });
const keyboard = createKeyboardScope('results', {
  ArrowDown: () => focus.move('ArrowDown'),
});
if (keyboard.dispatch({ key: 'ArrowDown', scope: 'results' })) {
  if (focus.active() !== 'two') throw new Error('Keyboard adapter failed');
}
```

## Limits and errors

IDs are unique nonempty strings up to 256 UTF-16 units. `maxItems` is a non-negative safe integer.
Capacity and invalid numeric options throw `RangeError`; malformed IDs, unknown/disabled focus
targets, invalid bindings, or invalid dispatch inputs throw `TypeError`. Mutators validate complete
ID sets before changing state. Scope mismatch and composing input return `false` without dispatch.
State and snapshots are O(N) in item count; focus lookup is bounded by the 10,000-item default.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
