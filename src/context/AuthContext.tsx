import { getCurrentUser, isEmailVerified } from '@/lib/appwrite/user';
import { IContextType, IUser } from '@/types';
import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useReducer,
} from 'react';

// Action Types
type AuthAction =
  | { type: 'SET_USER'; payload: IUser }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH'; payload: boolean }
  | { type: 'SET_VERIFIED'; payload: boolean }
  | { type: 'RESET' };

// State Interface
interface AuthState {
  user: IUser;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
}

// Initial States
export const INITIAL_USER: IUser = {
  id: '',
  accountId: '',
  name: '',
  profession: '',
  hometown: '',
  username: '',
  email: '',
  dpUrl: '',
  coverUrl: '',
  bio: '',
};

const initialState: AuthState = {
  user: INITIAL_USER,
  isLoading: true, // Start with loading true
  isAuthenticated: false,
  isVerified: false,
};

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AUTH':
      return { ...state, isAuthenticated: action.payload };
    case 'SET_VERIFIED':
      return { ...state, isVerified: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

export const AuthContext = createContext<IContextType | null>(null);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const checkEmailVerification = useCallback(async () => {
    try {
      const verified = await isEmailVerified();
      dispatch({ type: 'SET_VERIFIED', payload: verified });
      return verified;
    } catch (error) {
      console.error('Email verification check failed:', error);
      return false;
    }
  }, []);

  const checkAuthUser = useCallback(async () => {
    try {
      const currentAccount = await getCurrentUser();

      if (!currentAccount) {
        dispatch({ type: 'SET_AUTH', payload: false });
        dispatch({ type: 'SET_LOADING', payload: false });
        return false;
      }

      const verified = await checkEmailVerification();

      dispatch({
        type: 'SET_USER',
        payload: {
          id: currentAccount.$id,
          accountId: currentAccount.accountId,
          name: currentAccount.name || '',
          email: currentAccount.email || '',
          profession: currentAccount.profession || '',
          hometown: currentAccount.hometown || '',
          username: currentAccount.username || '',
          dpUrl: currentAccount.dpUrl || '',
          coverUrl: currentAccount.coverUrl || '',
          bio: currentAccount.bio || '',
        },
      });

      dispatch({ type: 'SET_AUTH', payload: true });
      dispatch({ type: 'SET_VERIFIED', payload: verified });
      dispatch({ type: 'SET_LOADING', payload: false });

      return true;
    } catch (error) {
      console.error('Error checking auth:', error);
      dispatch({ type: 'SET_AUTH', payload: false });
      dispatch({ type: 'SET_LOADING', payload: false });

      return false;
    }
  }, [checkEmailVerification]);

  // Check auth status on mount
  useEffect(() => {
    checkAuthUser();
  }, [checkAuthUser]);

  const setUser = (user: IUser) => {
    dispatch({ type: 'SET_USER', payload: user });
  };

  const setIsAuthenticated = (isAuthenticated: boolean) => {
    dispatch({ type: 'SET_AUTH', payload: isAuthenticated });
  };

  const value = useMemo(
    () => ({
      user: state.user,
      isLoading: state.isLoading,
      isAuthenticated: state.isAuthenticated,
      isVerified: state.isVerified,
      checkAuthUser,
      checkEmailVerification,
      setUser,
      setIsAuthenticated,
    }),
    [state, checkAuthUser, checkEmailVerification]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

export const useUserContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useUserContext must be used within AuthProvider');
  }
  return context;
};
