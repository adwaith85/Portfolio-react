import { useSyncExternalStore } from "react";

let state = {
  ui: "full", // "full" | "min" | "closed"
  status: "Scanning page...",
  actions: 0,
  agents: 0,
};

const listeners = new Set();
const emit = () => listeners.forEach((l) => l());

export const agentStore = {
  get: () => state,
  set(patch) {
    state = { ...state, ...patch };
    emit();
  },
  addActions(n = 1) {
    state = { ...state, actions: state.actions + n };
    emit();
  },
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

export const useAgents = () =>
  useSyncExternalStore(agentStore.subscribe, agentStore.get);