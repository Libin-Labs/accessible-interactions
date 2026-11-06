import { createRovingFocus, type RovingFocus } from '@lp-labs/accessible-interactions';

const focus: RovingFocus = createRovingFocus(['first']);
const active: string | null = focus.active();
void active;
