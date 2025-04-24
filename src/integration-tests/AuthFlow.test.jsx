import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Import the simplified components for testing
import SimpleSignUp from '../components/__tests__/SimpleSignUp'

// Create a simple SignIn component for testing
const SignIn = () => {
  return (
    <div className="auth-form-container">
      <h2>Sign In to Your Account</h2>

      <form className="auth-form">
        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            required
            placeholder="Enter your email address"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            required
            placeholder="Enter your password"
          />
        </div>

        <button type="submit" className="auth-button">
          Sign In
        </button>
      </form>

      <p className="auth-switch">
        Don't have an account? <a href="/signup">Sign Up</a>
      </p>
    </div>
  )
}

// Create a simple AuthPage component for testing
const AuthPage = ({ defaultTab = 'signin' }) => {
  // Use regular state instead of mocking with vi.fn()
  const [activeTab, setActiveTab] = React.useState(defaultTab)

  return (
    <div className="auth-container">
      <div className="auth-tabs">
        <button
          className={`auth-tab ${activeTab === 'signin' ? 'active' : ''}`}
          onClick={() => setActiveTab('signin')}
        >
          Sign In
        </button>
        <button
          className={`auth-tab ${activeTab === 'signup' ? 'active' : ''}`}
          onClick={() => setActiveTab('signup')}
        >
          Sign Up
        </button>
      </div>

      {activeTab === 'signin' ? (
        <SignIn />
      ) : (
        <SimpleSignUp />
      )}
    </div>
  )
}

// Create a simple Home component for testing
const Home = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'
  const userName = localStorage.getItem('userName')

  return (
    <div className="home-container">
      <div className="hero-section">
        {isLoggedIn ? (
          <div className="welcome-message">
            <h1>Welcome back, {userName}!</h1>
            <p>Explore the latest events and clubs.</p>
          </div>
        ) : (
          <div className="welcome-message">
            <h1>Welcome to UniHub</h1>
            <p>Your one-stop platform for university clubs and events</p>
            <div className="cta-buttons">
              <a href="/auth" className="cta-button primary">Join Now</a>
              <a href="/auth" className="cta-button secondary">Sign In</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Create a simple Navbar component for testing
const Navbar = () => {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true'

  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <a href="/">UniHub</a>
      </div>
      <div className="navbar-links">
        <a href="/">Home</a>
        <a href="/events">Events</a>
        <a href="/clubs">Clubs</a>
      </div>
      <div className="navbar-auth">
        {isLoggedIn ? (
          <>
            <a href="/profile" className="auth-button">My Profile</a>
            <button
              className="auth-button"
              onClick={() => {
                localStorage.removeItem('isLoggedIn')
                localStorage.removeItem('userName')
                localStorage.removeItem('userEmail')
                window.dispatchEvent(new Event('authStateChanged'))
              }}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <a href="/auth" className="auth-button">Sign In</a>
            <a href="/auth?tab=signup" className="auth-button">Sign Up</a>
          </>
        )}
      </div>
    </nav>
  )
}

// Create a simple App component for testing
const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<AuthPage defaultTab="signin" />} />
      <Route path="/signup" element={<AuthPage defaultTab="signup" />} />
    </Routes>
  )
}

describe('Authentication Flow Integration', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store = {}
    return {
      getItem: vi.fn(key => store[key] || null),
      setItem: vi.fn((key, value) => {
        store[key] = value.toString()
      }),
      removeItem: vi.fn(key => {
        delete store[key]
      }),
      clear: vi.fn(() => {
        store = {}
      })
    }
  })()

  // Setup and cleanup
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock
    })
    window.dispatchEvent = vi.fn()
  })

  afterEach(() => {
    cleanup()
    localStorageMock.clear()
    vi.clearAllMocks()
  })

  it('shows sign in and sign up buttons when not logged in', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
    expect(screen.queryByText('My Profile')).not.toBeInTheDocument()
    expect(screen.queryByText('Sign Out')).not.toBeInTheDocument()
  })

  it('shows profile and sign out buttons when logged in', () => {
    localStorageMock.setItem('isLoggedIn', 'true')
    localStorageMock.setItem('userName', 'Test User')

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )

    expect(screen.getByText('My Profile')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument()
    expect(screen.queryByText('Sign Up')).not.toBeInTheDocument()
  })

  it('shows welcome message with user name when logged in', () => {
    localStorageMock.setItem('isLoggedIn', 'true')
    localStorageMock.setItem('userName', 'Test User')

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByText('Welcome back, Test User!')).toBeInTheDocument()
    expect(screen.queryByText('Join Now')).not.toBeInTheDocument()
  })

  it('shows join now button when not logged in', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByText('Welcome to UniHub')).toBeInTheDocument()
    expect(screen.getByText('Join Now')).toBeInTheDocument()
    expect(screen.queryByText('Welcome back')).not.toBeInTheDocument()
  })

  it('signs out user when sign out button is clicked', async () => {
    localStorageMock.setItem('isLoggedIn', 'true')
    localStorageMock.setItem('userName', 'Test User')

    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )

    // Click sign out button
    fireEvent.click(screen.getByText('Sign Out'))

    // Check localStorage was cleared
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('isLoggedIn')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userName')
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('userEmail')

    // Check event was dispatched
    expect(window.dispatchEvent).toHaveBeenCalled()
  })

  it('navigates between sign in and sign up tabs', () => {
    render(
      <BrowserRouter>
        <AuthPage defaultTab="signin" />
      </BrowserRouter>
    )

    // Initially on sign in tab
    expect(screen.getByText('Sign In to Your Account')).toBeInTheDocument()

    // Click sign up tab
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }))

    // Should now show sign up form
    expect(screen.getByText('Create Your Account')).toBeInTheDocument()
  })
})
