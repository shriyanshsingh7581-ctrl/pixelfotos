import { useStudioContext } from '../contexts/AuthContext';

export function useAuth() {
  return useStudioContext();
}
