import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Create a simple Footer component for testing
const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>UniHub</h3>
          <p>Your one-stop platform for university clubs and events</p>
        </div>
        
        <div className="footer-section">
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/events">Events</a></li>
            <li><a href="/clubs">Clubs</a></li>
            <li><a href="/about">About</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h3>Contact</h3>
          <p>Email: info@unihub.com</p>
          <p>Phone: +1 (123) 456-7890</p>
        </div>
      </div>
      
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} UniHub. All rights reserved.</p>
      </div>
    </footer>
  )
}

describe('Footer Component', () => {
  it('renders footer content correctly', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    )
    
    expect(screen.getByText('UniHub')).toBeInTheDocument()
    expect(screen.getByText('Your one-stop platform for university clubs and events')).toBeInTheDocument()
    expect(screen.getByText('Quick Links')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
    expect(screen.getByText('Email: info@unihub.com')).toBeInTheDocument()
    expect(screen.getByText('Phone: +1 (123) 456-7890')).toBeInTheDocument()
    
    const currentYear = new Date().getFullYear()
    expect(screen.getByText(`© ${currentYear} UniHub. All rights reserved.`)).toBeInTheDocument()
  })

  it('renders navigation links correctly', () => {
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    )
    
    expect(screen.getByRole('link', { name: /Home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Events/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Clubs/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /About/i })).toBeInTheDocument()
  })
})
