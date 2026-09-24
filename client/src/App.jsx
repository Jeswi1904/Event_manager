import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Invite from './pages/Invite';

const App = () => (
  <BrowserRouter>
    <UserProvider>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/invite/:inviteCode" element={<Invite />} />
          {/* 404 fallback */}
          <Route
            path="*"
            element={
              <div className="page-wrapper">
                <div className="container state-container">
                  <div className="state-icon">404</div>
                  <div className="state-title">Page not found</div>
                  <a href="/" className="btn btn-primary">Go Home</a>
                </div>
              </div>
            }
          />
        </Routes>
      </main>
    </UserProvider>
  </BrowserRouter>
);

export default App;
