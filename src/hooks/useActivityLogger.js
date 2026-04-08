import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';

export const useActivityLogger = () => {
  const { dispatch } = useData();
  const { user } = useAuth();

  const logAction = (action, details) => {
    dispatch({
      type: 'LOG_ACTIVITY',
      payload: {
        userId: user?.id || 'SYSTEM',
        userName: user?.name || 'Hệ Thống',
        action,
        details
      }
    });
  };

  return { logAction };
};
