/*
  Only one build owns the cursors at a time.
  When a new section starts, the previous build is jumped to its finished
  state, so its cursors are already gone before the new ones appear.
*/
let active = null;

export const handoff = {
  claim(tl) {
    if (active && active !== tl && !active.reversed() && active.progress() < 1) {
      active.progress(1); // events are suppressed: only the end state is rendered
    }
    active = tl;
  },
};