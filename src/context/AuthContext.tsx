import { getAccount, getCurrentUser, isEmailVerified } from '@/lib/appwrite/user';
import { IContextType, IUser } from '@/types';
import React, { createContext, useContext, useEffect, useCallback, useMemo, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';

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
  isLoading: false,
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
  const navigate = useNavigate();

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
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const currentAccount = await getCurrentUser();
      const verified = await checkEmailVerification();

      if (currentAccount && !verified) {
        navigate('/verify-email');
        return false;
      }

      if (currentAccount && verified) {
        dispatch({
          type: 'SET_USER',
          payload: {
            id: currentAccount.$id,
            accountId: currentAccount.accountId,
            name: currentAccount.name || '',
            profession: currentAccount.profession || '',
            hometown: currentAccount.hometown || '',
            username: currentAccount.username || '',
            email: currentAccount.email || '',
            dpUrl: currentAccount.dpUrl || '',
            coverUrl: currentAccount.coverUrl || '',
            bio: currentAccount.bio || '',
          },
        });
        dispatch({ type: 'SET_AUTH', payload: true });
        return true;
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
    return false;
  }, [navigate, checkEmailVerification]);

  useEffect(() => {
    let mounted = true;

    const checkAuthStatus = async () => {
      try {
        const account = await getAccount();
        if (!account && mounted) {
          navigate('/sign-in');
          return;
        }
        if (mounted) {
          await checkAuthUser();
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        if (mounted) {
          navigate('/sign-in');
        }
      }
    };

    checkAuthStatus();

    return () => {
      mounted = false;
    };
  }, [checkAuthUser, navigate]);

  const contextValue: IContextType = useMemo(
    () => ({
      user: state.user,
      isLoading: state.isLoading,
      isAuthenticated: state.isAuthenticated,
      isVerified: state.isVerified,
      setUser: (value: React.SetStateAction<IUser>) => {
        const newUser = typeof value === 'function' ? value(state.user) : value;
        dispatch({ type: 'SET_USER', payload: newUser });
      },
      setIsAuthenticated: (value: React.SetStateAction<boolean>) => {
        const newAuth = typeof value === 'function' ? value(state.isAuthenticated) : value;
        dispatch({ type: 'SET_AUTH', payload: newAuth });
      },
      checkAuthUser,
      checkEmailVerification,
    }),
    [state, checkAuthUser, checkEmailVerification]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;

export const useUserContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useUserContext must be used within AuthProvider');
  }
  return context;
};
