import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const UserContext = createContext(null);

/**
 * UserProvider
 *
 * Manages the "current user" for demo purposes.
 * On first load, fetches the two seeded demo users from the backend.
 * The selected user is stored in localStorage so it persists across refreshes.
 *
 * In production, replace this with a real auth provider (JWT/session).
 * The userId structure is already correct for future auth integration.
 */
export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await api.get('/users/demo-users');
        const demoUsers = res.data.users || [];
        setUsers(demoUsers);

        // Restore previously selected user from localStorage
        const savedId = localStorage.getItem('currentUserId');
        const saved = demoUsers.find((u) => u._id === savedId);
        setCurrentUser(saved || demoUsers[0] || null);
      } catch (err) {
        console.error('Failed to load demo users:', err.message);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const switchUser = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUserId', user._id);
  };

  return (
    <UserContext.Provider value={{ currentUser, users, switchUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
