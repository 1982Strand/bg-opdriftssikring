import { ACCESS, udgaveFraMiljoe, type Access } from './udgaver';

export type { Access } from './udgaver';

const access = ACCESS[udgaveFraMiljoe(import.meta.env.VITE_UDGAVE)];

export function useAccess(): Access {
  return access;
}
