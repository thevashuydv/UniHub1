import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import AOS from 'aos'
import 'aos/dist/aos.css'
import './App.css'
import './components/Auth.css'

// Components
import Navbar from './components/Navbar'
import Home from './components/Home'
import SignUp from './components/SignUp'
import SignIn from './components/SignIn'
import ClubSignUp from './components/ClubSignUp'
import Clubs from './components/Clubs'
import Events from './components/Events'
import About from './components/About'
import ClubAdminDashboard from './components/ClubAdminDashboard'

// Pages
import AuthPage from './pages/AuthPage'
import ClubDetailPage from './pages/ClubDetailPage'
import UserProfilePage from './pages/UserProfilePage'
import AnnouncementsPage from './pages/AnnouncementsPage'

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
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<AuthPage defaultTab="signin" />} />
        <Route path="/signup" element={<AuthPage defaultTab="signup" />} />
        <Route path="/clubs" element={<Clubs />} />
        <Route path="/clubs/:clubId" element={<ClubDetailPage />} />
        <Route path="/events" element={<Events />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/dashboard" element={<ClubAdminDashboard />} />
        <Route path="/profile" element={<UserProfilePage />} />
      </Routes>
    </Router>
  )
}

export default App
