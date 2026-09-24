import { NavLink } from 'react-router-dom';
import { useUser } from '../context/UserContext';

const Navbar = () => {
  const { users, currentUser, switchUser } = useUser();

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        {/* Logo */}
        <NavLink to="/" className="navbar-logo">
          ⚡ EventPulse
        </NavLink>

        {/* Nav links */}
        <div className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
          >
            Discover
          </NavLink>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
          >
            My RSVPs
          </NavLink>
        </div>

        {/* Demo user selector */}
        <div className="navbar-right">
          <div className="user-selector" aria-label="Switch demo user">
            <span className="user-selector-label">User:</span>
            {users.map((u) => (
              <button
                key={u._id}
                id={`user-btn-${u._id}`}
                className={`user-btn${currentUser?._id === u._id ? ' selected' : ''}`}
                onClick={() => switchUser(u)}
                title={u.email}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
