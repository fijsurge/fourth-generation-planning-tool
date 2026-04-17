type Listener = () => void;
const listeners: Set<Listener> = new Set();

export const goalEvents = {
  /** Subscribe to goal-saved events. Returns an unsubscribe function. */
  onGoalSaved: (fn: Listener): (() => void) => {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  /** Emit after a goal is successfully created or updated. */
  emitGoalSaved: (): void => {
    listeners.forEach((fn) => fn());
  },
};
