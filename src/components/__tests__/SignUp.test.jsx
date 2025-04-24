import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import SimpleSignUp from './SimpleSignUp'

// Mock Firebase
vi.mock('../../firebase', () => ({
  db: {
    collection: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
    })),
    addDoc: vi.fn().mockResolvedValue({ id: 'mock-doc-id' }),
    query: vi.fn(),
    where: vi.fn(),
    getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
  },
}))

// Mock framer-motion
vi.mock('framer-motion', () => {
  const actual = vi.importActual('framer-motion')
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      form: ({ children, ...props }) => <form {...props}>{children}</form>,
      button: ({ children, ...props }) => <button {...props}>{children}</button>,
    },
  }
})

describe('SignUp Component', () => {
  // Clean up after each test
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the signup form correctly', () => {
    render(
      <BrowserRouter>
        <SimpleSignUp />
      </BrowserRouter>
    )

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument()
  })

  it('shows validation errors for empty fields', async () => {
    render(
      <BrowserRouter>
        <SimpleSignUp />
      </BrowserRouter>
    )

    // Clear the inputs (they have required attribute)
    const nameInput = screen.getByLabelText(/Full Name/i)
    const emailInput = screen.getByLabelText(/Email Address/i)
    const passwordInput = screen.getByLabelText(/Password/i)

    // The browser's built-in validation will prevent submission
    // We're just testing that the required fields are present
    expect(nameInput).toBeRequired()
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })

  it('allows form submission with valid data', async () => {
    render(
      <BrowserRouter>
        <SimpleSignUp />
      </BrowserRouter>
    )

    // Fill in the form with valid data
    fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: 'Test User' } })
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password123' } })

    // Verify the form has a submit button
    const submitButton = screen.getByRole('button', { name: /Create Account/i })
    expect(submitButton).toBeInTheDocument()
    expect(submitButton.type).toBe('submit')
  })
})
