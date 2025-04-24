import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Navbar from '../Navbar'

// Mock framer-motion
vi.mock('framer-motion', () => {
  const actual = vi.importActual('framer-motion')
  return {
    ...actual,
    motion: {
      nav: ({ children, ...props }) => <nav {...props}>{children}</nav>,
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      button: ({ children, ...props }) => <button {...props}>{children}</button>,
      li: ({ children, ...props }) => <li {...props}>{children}</li>,
      h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
      i: ({ children, ...props }) => <i {...props}>{children}</i>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  }
})

describe('Navbar Component', () => {
  // Clean up after each test
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders the logo correctly', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Uni')).toBeInTheDocument()
    expect(screen.getByText('Hub')).toBeInTheDocument()
  })

  it('shows sign in and sign up buttons when not logged in', () => {
    localStorage.setItem('isLoggedIn', 'false')
    
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Sign Up')).toBeInTheDocument()
  })

  it('shows profile and sign out buttons when logged in', () => {
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userName', 'Test User')
    
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )
    
    expect(screen.getByText('My Profile')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('shows dashboard link for club admins', () => {
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userName', 'Admin User')
    localStorage.setItem('userRole', 'club_admin')
    
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
