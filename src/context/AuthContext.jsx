import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import {
  login as loginRequest,
  register as registerRequest,
  getCurrentUser,
  getAddress,
  updateAddress,
} from '../services/authService';
import { getToken, setToken, clearToken } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [loading, setLoading] = useState(!!getToken());

  const fetchCurrentUser = useCallback(async () => {
    // Retry transient failures (network blips / slow backend cold start) so a
    // single failed request on first load cannot kick the user off /admin.
    const MAX_RETRIES = 2;
    try {
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
          const res = await getCurrentUser();
          setUser(res.data);
          return res.data;
        } catch (err) {
          if (err.response?.status === 401) {
            clearToken();
            setTokenState(null);
            setUser(null);
            return null;
          }
          if (attempt < MAX_RETRIES) {
            await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
          }
        }
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (getToken()) {
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    const res = await loginRequest(credentials);
    setToken(res.data.token);
    setTokenState(res.data.token);
    setUser(res.data);
    return res.data;
  };

  const register = async (payload) => {
    const res = await registerRequest(payload);
    setToken(res.data.token);
    setTokenState(res.data.token);
    setUser(res.data);
    return res.data;
  };

  const logout = () => {
    clearToken();
    setTokenState(null);
    setUser(null);
  };

  const getUserAddress = async () => {
    const res = await getAddress();
    return res.data;
  };

  const saveAddress = async (address) => {
    const res = await updateAddress(address);
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token,
        isAdmin: !!user?.roles?.includes('Admin'),
        login,
        register,
        logout,
        fetchCurrentUser,
        getUserAddress,
        saveAddress,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
