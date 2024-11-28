import { getAccount, getCurrentUser } from '@/lib/appwrite/user';
import { IContextType, IUser } from '@/types';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';

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

const INITIAL_STATE: IContextType = {
  user: INITIAL_USER,
  isLoading: false,
  isAuthenticated: false,
  setUser: () => {},
  setIsAuthenticated: () => {},
  checkAuthUser: async () => false,
};

const AuthContext = createContext<IContextType>(INITIAL_STATE);

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<IUser>(INITIAL_USER);
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const checkAuthUser = useCallback(async () => {
    setIsLoading(true);
    try {
      const currentAccount = await getCurrentUser();
      // console.log('currentAccount', currentAccount);

      if (currentAccount) {
        setUser({
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
        });
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    } finally {
      setIsLoading(false);
    }
    return false;
  }, []);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const account = await getAccount();
        if (!account) {
          navigate('/sign-in');
          return;
        }
        await checkAuthUser();
      } catch (error) {
        console.error('Error checking auth status:', error);
        navigate('/sign-in');
      }
    };
    checkAuthStatus();
  }, [checkAuthUser]);

  const value = {
    user,
    setUser,
    isLoading,
    isAuthenticated,
    setIsAuthenticated,
    checkAuthUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

export const useUserContext = () => useContext(AuthContext);
