export type FocusOrientation = 'horizontal' | 'vertical' | 'both';
export type FocusKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight' | 'Home' | 'End';

export interface FocusOptions {
  orientation?: FocusOrientation;
  loop?: boolean;
  maxItems?: number;
}

export interface FocusSnapshot {
  items: string[];
  disabled: string[];
  active: string | null;
}

export interface RovingFocus {
  active(): string | null;
  focus(id: string): string;
  move(key: FocusKey): string | null;
  setDisabled(ids: Iterable<string>): void;
  replaceItems(ids: Iterable<string>): void;
  snapshot(): FocusSnapshot;
}

export interface KeyboardInput {
  key: string;
  scope: string;
  repeat?: boolean;
  composing?: boolean;
}

export type KeyboardHandler = (input: Readonly<KeyboardInput>) => void;
export type KeyboardBindings = Readonly<Record<string, KeyboardHandler>>;

export interface KeyboardScope {
  readonly id: string;
  dispatch(input: KeyboardInput): boolean;
}

function readIds(input: Iterable<string>, maximum: number): string[] {
  if (input == null || typeof input[Symbol.iterator] !== 'function')
    throw new TypeError('Expected iterable item IDs.');
  const result: string[] = [];
  const seen = new Set<string>();
  for (const id of input) {
    if (result.length >= maximum) throw new RangeError('Item capacity exceeded.');
    if (typeof id !== 'string' || id.length === 0 || id.length > 256)
      throw new TypeError('Item IDs must be nonempty strings up to 256 units.');
    if (seen.has(id)) throw new TypeError(`Duplicate item ID: ${id}`);
    seen.add(id);
    result.push(id);
  }
  return result;
}

export function createRovingFocus(
  input: Iterable<string>,
  options: FocusOptions = {},
): RovingFocus {
  const orientation = options.orientation ?? 'both';
  if (!['horizontal', 'vertical', 'both'].includes(orientation))
    throw new TypeError('Unsupported focus orientation.');
  if (options.loop !== undefined && typeof options.loop !== 'boolean')
    throw new TypeError('loop must be a boolean.');
  const maximum = options.maxItems ?? 10_000;
  if (!Number.isSafeInteger(maximum) || maximum < 0)
    throw new RangeError('maxItems must be a non-negative safe integer.');
  let items = readIds(input, maximum);
  let disabled = new Set<string>();
  let active: string | null = items[0] ?? null;

  const enabled = () => items.filter((id) => !disabled.has(id));
  const focus = (id: string): string => {
    if (!items.includes(id)) throw new TypeError(`Unknown item: ${id}`);
    if (disabled.has(id)) throw new TypeError(`Cannot focus disabled item: ${id}`);
    active = id;
    return id;
  };
  const move = (key: FocusKey): string | null => {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key))
      throw new TypeError('Unsupported focus key.');
    const horizontalKey = key === 'ArrowLeft' || key === 'ArrowRight';
    const verticalKey = key === 'ArrowUp' || key === 'ArrowDown';
    if (
      (horizontalKey && orientation === 'vertical') ||
      (verticalKey && orientation === 'horizontal')
    )
      return active;
    const available = enabled();
    if (!available.length) {
      active = null;
      return null;
    }
    if (key === 'Home') return focus(available[0]!);
    if (key === 'End') return focus(available[available.length - 1]!);
    const direction = key === 'ArrowLeft' || key === 'ArrowUp' ? -1 : 1;
    const current = active === null ? -1 : available.indexOf(active);
    const base = current < 0 ? (direction < 0 ? 0 : -1) : current;
    let next = base + direction;
    if (options.loop) next = (next + available.length) % available.length;
    else next = Math.max(0, Math.min(available.length - 1, next));
    return focus(available[next]!);
  };
  return {
    active: () => active,
    focus,
    move,
    setDisabled(input) {
      const next = new Set(readIds(input, maximum));
      for (const id of next) if (!items.includes(id)) throw new TypeError(`Unknown item: ${id}`);
      disabled = next;
      if (active !== null && disabled.has(active)) active = enabled()[0] ?? null;
    },
    replaceItems(input) {
      const next = readIds(input, maximum);
      items = next;
      disabled = new Set([...disabled].filter((id) => items.includes(id)));
      if (active === null || !items.includes(active) || disabled.has(active))
        active = enabled()[0] ?? null;
    },
    snapshot: () => ({ items: [...items], disabled: [...disabled], active }),
  };
}

export function createKeyboardScope(id: string, bindings: KeyboardBindings): KeyboardScope {
  if (typeof id !== 'string' || id.length === 0 || id.length > 128)
    throw new TypeError('Scope ID must be a nonempty string up to 128 units.');
  if (!bindings || typeof bindings !== 'object' || Array.isArray(bindings))
    throw new TypeError('Bindings must be a key-to-handler object.');
  const handlers = new Map<string, KeyboardHandler>();
  for (const [key, handler] of Object.entries(bindings)) {
    if (!key || key.length > 128 || typeof handler !== 'function')
      throw new TypeError('Each keyboard binding needs a valid key and function.');
    handlers.set(key, handler);
  }
  return {
    id,
    dispatch(input) {
      if (
        !input ||
        typeof input !== 'object' ||
        typeof input.key !== 'string' ||
        typeof input.scope !== 'string'
      )
        throw new TypeError('Expected a keyboard input with key and scope.');
      if (input.repeat !== undefined && typeof input.repeat !== 'boolean')
        throw new TypeError('repeat must be a boolean.');
      if (input.composing !== undefined && typeof input.composing !== 'boolean')
        throw new TypeError('composing must be a boolean.');
      if (input.scope !== id || input.composing) return false;
      const handler = handlers.get(input.key);
      if (!handler) return false;
      handler(Object.freeze({ ...input }));
      return true;
    },
  };
}
