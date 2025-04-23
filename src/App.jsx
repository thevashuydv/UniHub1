import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import './App.css'
import './components/Auth.css'
import EmailServiceInitializer from './components/EmailServiceInitializer'

// Components
import Navbar from './components/Navbar'
import Home from './components/Home'
import SignUp from './components/SignUp'
import SignIn from './components/SignIn'
import ClubSignUp from './components/ClubSignUp'
import Clubs from './components/Clubs'
import Events from './components/Events'
import ClubAdminDashboard from './components/ClubAdminDashboard'
import RouteGuard from './components/RouteGuard'

// Pages
import AuthPage from './pages/AuthPage'
import ClubDetailPage from './pages/ClubDetailPage'
import UserProfilePage from './pages/UserProfilePage'
import ViewUserProfilePage from './pages/ViewUserProfilePage'
import AnnouncementsPage from './pages/AnnouncementsPage'
import EventDetailPage from './pages/EventDetailPage'

function App() {
  useEffect(() => {
    // Initialize AOS animation library
    AOS.init({
      duration: 800,
      easing: 'ease-in-out',
      once: false,
      mirror: true
    });
  }, []);

  return (
    <Router>
      <EmailServiceInitializer />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<AuthPage defaultTab="signin" />} />
        <Route path="/signup" element={<AuthPage defaultTab="signup" />} />
        <Route path="/clubs" element={
          <RouteGuard
            redirectTo="/dashboard"
            condition={() => localStorage.getItem('userRole') !== 'club_admin'}
          >
            <Clubs />
          </RouteGuard>
        } />
        <Route path="/clubs/:clubId" element={
          <RouteGuard
            redirectTo="/dashboard"
            condition={() => {
              const isClubAdmin = localStorage.getItem('userRole') === 'club_admin';
              const adminClubId = localStorage.getItem('clubId');
              const urlClubId = window.location.pathname.split('/')[2];

              // Allow if not a club admin, or if admin viewing their own club
              return !isClubAdmin || (isClubAdmin && adminClubId === urlClubId);
            }}
          >
            <ClubDetailPage />
          </RouteGuard>
        } />
        <Route path="/events" element={<Events />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/about" element={<Navigate to="/" replace />} />
        <Route path="/dashboard" element={<ClubAdminDashboard />} />
        <Route path="/profile" element={<UserProfilePage />} />
        <Route path="/user/:userType/:userId" element={<ViewUserProfilePage />} />
      </Routes>
    </Router>
  )
}

export default App
