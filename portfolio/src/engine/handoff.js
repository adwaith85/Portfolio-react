import { swarm } from "../components/cursors/swarmApi";

/*
  Cursor ownership.

  The original engine had one active build. A new section finishing the old
  build is still the right behaviour across sections, but a section now has
  several viewport groups that can enter together. Those groups are allowed to
  animate in parallel because each one leases a DIFFERENT set of cursor agents.

  - handoff.claim(tl)        legacy single-owner API (Intro / playOnEnter)
  - handoff.begin(id, tl)    a viewport group starts; previous sections finish
  - handoff.end(id, tl)      a group left / reversed and gives its lease back
  - handoff.release(tl)      forget a timeline completely
  - handoff.isActive(id)     is this section currently driving the cursors?

  The ID is a section key (for example "what-i-do"). Groups inside the same
  section never interrupt each other. When a different section starts, every
  older timeline is jumped to its finished state and the swarm is taken over,
  exactly like the original section-to-section handoff.
*/

let legacy = null; // one whole-section timeline (Intro / playOnEnter)
let sectionId = null; // current section driving the swarm
const active = new Set(); // viewport-group timelines of that section

const finish = (tl) => {
  if (!tl) return;
  try {
    if (tl.progress() < 1) tl.progress(1); // events suppressed: end state only
  } catch {
    /* a killed timeline can no longer be measured */
  }
};

export const handoff = {
  claim(tl) {
    // Legacy single-owner claim. A section-based group takes priority.
    if (sectionId) {
      active.forEach(finish);
      active.clear();
      sectionId = null;
    }
    if (legacy && legacy !== tl && !legacy.reversed() && legacy.progress() < 1) {
      finish(legacy);
    }
    legacy = tl;
  },

  begin(id, tl) {
    let changed = false;

    if (legacy) {
      finish(legacy);
      legacy = null;
      changed = true;
    }

    if (sectionId !== id) {
      if (sectionId) {
        active.forEach(finish);
      }
      active.clear();
      sectionId = id;
      changed = true;
    }

    if (tl) active.add(tl);

    // A different section now owns the swarm: stop every cursor.
    // The new group immediately shows only the agents in its own lease.
    if (changed) swarm.takeOver();

    return changed;
  },

  end(id, tl) {
    if (tl) active.delete(tl);
    if (sectionId === id && active.size === 0) sectionId = null;
  },

  release(tl) {
    active.delete(tl);
    if (legacy === tl) legacy = null;
    if (active.size === 0) sectionId = null;
  },

  isActive(id) {
    return sectionId === id && !legacy;
  },

  getSection() {
    return sectionId;
  },
};
