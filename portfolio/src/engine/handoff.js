/*
  Cursor ownership.

  Sections can now overlap in time: a group that has started is allowed to
  finish its animation even after the next section enters the viewport. That
  is why a section starting no longer force-finishes the previous section.

  - handoff.claim(tl)        legacy single-owner API (Intro / playOnEnter)
  - handoff.begin(id, tl)    a viewport group starts
  - handoff.end(id, tl)      a group finished and gives its lease back
  - handoff.release(tl)      forget a timeline completely
  - handoff.isActive(id)     does this section still have running groups?

  Groups inside one section use disjoint agent indices. Different sections
  reuse those indices, so if two sections overlap the cursors are shared; both
  content animations still play to completion instead of being cut short.
*/

let legacy = null; // one whole-section timeline (Intro / playOnEnter)
let sectionId = null; // most recently started section
const active = new Map(); // section id -> Set of running group timelines

const finish = (tl) => {
  if (!tl) return;
  try {
    if (tl.progress() < 1) tl.progress(1); // used only by the legacy claim
  } catch {
    /* a killed timeline can no longer be measured */
  }
};

export const handoff = {
  claim(tl) {
    // Legacy single-owner claim. It no longer stops section groups: whichever
    // build is already running is allowed to finish.
    if (legacy && legacy !== tl && !legacy.reversed() && legacy.progress() < 1) {
      finish(legacy);
    }
    legacy = tl;
  },

  begin(id, tl) {
    // A viewport section cancels the legacy whole-page build (the Intro). That
    // build is offscreen by the time section 2 starts, and letting its final
    // fadeOut run late would hide the cursors the new section just showed.
    // Only the legacy timeline is finished here; started section groups are
    // never snapped.
    if (legacy && legacy !== tl && !legacy.reversed() && legacy.progress() < 1) {
      finish(legacy);
      legacy = null;
    }

    const changed = sectionId !== id;
    sectionId = id;

    let set = active.get(id);
    if (!set) {
      set = new Set();
      active.set(id, set);
    }
    if (tl) set.add(tl);

    return changed;
  },

  end(id, tl) {
    const set = active.get(id);
    if (set && tl) set.delete(tl);
    if (set && set.size === 0) active.delete(id);
    if (sectionId === id && !active.has(id)) sectionId = null;
  },

  release(tl) {
    active.forEach((set, id) => {
      set.delete(tl);
      if (set.size === 0) active.delete(id);
    });
    if (legacy === tl) legacy = null;
    if (sectionId && !active.has(sectionId)) sectionId = null;
  },

  isActive(id) {
    return active.has(id);
  },

  getSection() {
    return sectionId;
  },
};
