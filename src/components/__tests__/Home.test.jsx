import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Home from '../Home'

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  }
})

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {
    collection: vi.fn().mockReturnThis(),
    getDocs: vi.fn().mockResolvedValue({ docs: [] }),
  },
}))

// Mock framer-motion
vi.mock('framer-motion', () => {
  const actual = vi.importActual('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
      h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
      p: ({ children, ...props }) => <p {...props}>{children}</p>,
      button: ({ children, ...props }) => <button {...props}>{children}</button>,
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  }
})

// Mock AOS
vi.mock('aos', () => ({
  default: {
    init: vi.fn(),
  },
}))

describe('Home Component', () => {
  // Clean up after each test
  afterEach(() => {
    cleanup()
    localStorage.clear()
    vi.clearAllMocks()
  })

  it('renders the welcome message correctly', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByText('Welcome to')).toBeInTheDocument()
    expect(screen.getByText('UniHub')).toBeInTheDocument()
    expect(screen.getByText('Your one-stop platform for university clubs and events')).toBeInTheDocument()
  })

  it('shows join now button when not logged in', () => {
    localStorage.setItem('isLoggedIn', 'false')

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByText('Join Now')).toBeInTheDocument()
    expect(screen.getByText('Sign In')).toBeInTheDocument()
  })

  it('shows personalized welcome message when logged in', () => {
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('userName', 'Test User')

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Explore Clubs')).toBeInTheDocument()
    expect(screen.getByText('Upcoming Events')).toBeInTheDocument()
  })

  it('renders the features section', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByText('What UniHub')).toBeInTheDocument()
    expect(screen.getByText('Offers')).toBeInTheDocument()
    expect(screen.getByText('Discover Clubs')).toBeInTheDocument()
    expect(screen.getByText('Track Events')).toBeInTheDocument()
    expect(screen.getByText('Connect')).toBeInTheDocument()
    expect(screen.getByText('Grow')).toBeInTheDocument()
  })

  it('renders the newsletter section', () => {
    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    )

    expect(screen.getByText('Stay')).toBeInTheDocument()
    expect(screen.getByText('Updated')).toBeInTheDocument()
    expect(screen.getByText('Subscribe to our newsletter to get the latest updates on clubs and events.')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Subscribe')).toBeInTheDocument()
  })
})
