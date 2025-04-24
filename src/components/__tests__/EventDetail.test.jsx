import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Create a simple EventDetail component for testing
const EventDetail = ({ event, onRegister, isRegistered }) => {
  return (
    <div className="event-detail">
      <div className="event-header">
        <h1 className="event-title">{event.title}</h1>
        <div className="event-meta">
          <span className="event-date">
            <i className="icon-calendar"></i> {event.date}
          </span>
          <span className="event-location">
            <i className="icon-location"></i> {event.location}
          </span>
        </div>
      </div>

      <div className="event-content">
        <div className="event-image-container">
          {event.image ? (
            <img src={event.image} alt={event.title} className="event-image" />
          ) : (
            <div className="event-image-placeholder">
              <span>{event.title.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="event-description">
          <h2>About This Event</h2>
          <p>{event.description}</p>
        </div>

        <div className="event-organizer">
          <h2>Organized by</h2>
          <div className="organizer-info">
            <div className="organizer-logo">
              {event.organizerLogo ? (
                <img src={event.organizerLogo} alt={event.organizer} />
              ) : (
                <div className="organizer-logo-placeholder">
                  <span>{event.organizer.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="organizer-details">
              <h3>{event.organizer}</h3>
              <p>{event.organizerDescription}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="event-actions">
        <button
          className={`register-button ${isRegistered ? 'registered' : ''}`}
          onClick={() => onRegister(event.id)}
          disabled={isRegistered}
        >
          {isRegistered ? 'Already Registered' : 'Register Now'}
        </button>
      </div>
    </div>
  )
}

describe('EventDetail Component', () => {
  const mockEvent = {
    id: 'event1',
    title: 'Tech Conference 2023',
    date: 'December 15, 2023',
    location: 'University Main Hall',
    description: 'A conference about the latest technologies and innovations.',
    image: 'https://example.com/event.jpg',
    organizer: 'Tech Club',
    organizerLogo: 'https://example.com/logo.jpg',
    organizerDescription: 'The premier technology club on campus.'
  }

  const mockRegisterFn = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders event details correctly', () => {
    render(
      <BrowserRouter>
        <EventDetail
          event={mockEvent}
          onRegister={mockRegisterFn}
          isRegistered={false}
        />
      </BrowserRouter>
    )

    expect(screen.getByText('Tech Conference 2023')).toBeInTheDocument()
    expect(screen.getByText('December 15, 2023')).toBeInTheDocument()
    expect(screen.getByText('University Main Hall')).toBeInTheDocument()
    expect(screen.getByText('A conference about the latest technologies and innovations.')).toBeInTheDocument()
    expect(screen.getByText('Tech Club')).toBeInTheDocument()
    expect(screen.getByText('The premier technology club on campus.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Register Now' })).toBeInTheDocument()

    const eventImage = screen.getByAltText('Tech Conference 2023')
    expect(eventImage).toBeInTheDocument()
    expect(eventImage.src).toBe('https://example.com/event.jpg')

    const organizerLogo = screen.getByAltText('Tech Club')
    expect(organizerLogo).toBeInTheDocument()
    expect(organizerLogo.src).toBe('https://example.com/logo.jpg')
  })

  it('shows placeholder when images are not provided', () => {
    const eventWithoutImages = {
      ...mockEvent,
      image: null,
      organizerLogo: null
    }

    render(
      <BrowserRouter>
        <EventDetail
          event={eventWithoutImages}
          onRegister={mockRegisterFn}
          isRegistered={false}
        />
      </BrowserRouter>
    )

    // Check for placeholders - we're looking for specific placeholders
    // Instead of counting all elements with 'T', check for specific elements
    expect(screen.getByText('T', { selector: '.event-image-placeholder span' })).toBeInTheDocument()
    expect(screen.getByText('T', { selector: '.organizer-logo-placeholder span' })).toBeInTheDocument()

    expect(screen.queryByAltText('Tech Conference 2023')).not.toBeInTheDocument()
    expect(screen.queryByAltText('Tech Club')).not.toBeInTheDocument()
  })

  it('calls onRegister when register button is clicked', () => {
    render(
      <BrowserRouter>
        <EventDetail
          event={mockEvent}
          onRegister={mockRegisterFn}
          isRegistered={false}
        />
      </BrowserRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'Register Now' }))
    expect(mockRegisterFn).toHaveBeenCalledWith('event1')
  })

  it('disables register button when already registered', () => {
    render(
      <BrowserRouter>
        <EventDetail
          event={mockEvent}
          onRegister={mockRegisterFn}
          isRegistered={true}
        />
      </BrowserRouter>
    )

    const registerButton = screen.getByRole('button', { name: 'Already Registered' })
    expect(registerButton).toBeInTheDocument()
    expect(registerButton).toBeDisabled()

    fireEvent.click(registerButton)
    expect(mockRegisterFn).not.toHaveBeenCalled()
  })
})
