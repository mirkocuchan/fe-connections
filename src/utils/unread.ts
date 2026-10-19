import { useSyncExternalStore } from "react";

let total = 0;
const listeners = new Set<() => void>();

export function setUnreadTotal(n: number) {
  if (n === total) return;
  total = n;
  listeners.forEach((l) => l()); //avisamos a todos los que están mirando el número
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useUnreadTotal() {
  return useSyncExternalStore(subscribe, () => total);
}