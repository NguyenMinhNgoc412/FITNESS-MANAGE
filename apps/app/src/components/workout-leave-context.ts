import { createContext, MutableRefObject } from 'react';
// Shell links push a screen rather than removing it; beforeRemove alone cannot guard them.
export const WorkoutLeaveContext = createContext<MutableRefObject<(() => Promise<boolean>) | null> | null>(null);
