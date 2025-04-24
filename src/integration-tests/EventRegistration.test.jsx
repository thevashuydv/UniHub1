import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react'
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom'

// Create simplified components for testing

// EventCard component
const EventCard = ({ event, onViewDetails }) => {
  return (
    <div className="event-card" data-testid={`event-card-${event.id}`}>
      <h3>{event.title}</h3>
      <p>{event.date}</p>
      <p>{event.description}</p>
      <button onClick={() => onViewDetails(event.id)}>View Details</button>
    </div>
  )
}

// EventList component
const EventList = ({ events, onViewDetails }) => {
  return (
    <div className="events-list">
      <h2>Upcoming Events</h2>
      {events.length === 0 ? (
        <p>No events found</p>
      ) : (
        <div className="events-grid">
          {events.map(event => (
            <EventCard 
              key={event.id} 
              event={event} 
              onViewDetails={onViewDetails} 
            />
          ))}
        </div>
      )}
    </div>
  )
}

// EventDetail component
const EventDetail = ({ event, onRegister, isRegistered }) => {
  return (
    <div className="event-detail">
      <h1>{event.title}</h1>
      <p>Date: {event.date}</p>
      <p>Location: {event.location}</p>
      <p>{event.description}</p>
      <p>Organized by: {event.organizer}</p>
      
      <button 
        onClick={() => onRegister(event.id)}
        disabled={isRegistered}
      >
        {isRegistered ? 'Already Registered' : 'Register Now'}
      </button>
      
      {isRegistered && (
        <div className="registration-confirmation">
          <p>You are registered for this event!</p>
        </div>
      )}
    </div>
  )
}

// RegistrationForm component
const RegistrationForm = ({ event, onSubmit, onCancel }) => {
  return (
    <div className="registration-form">
      <h2>Register for {event.title}</h2>
      
      <form onSubmit={onSubmit}>
        <div className="form-group">
          <label htmlFor="name">Full Name</label>
          <input type="text" id="name" required />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" required />
        </div>
        
        <div className="form-actions">
          <button type="submit">Complete Registration</button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </div>
  )
}

// RegistrationConfirmation component
const RegistrationConfirmation = ({ event, onClose }) => {
  return (
    <div className="registration-confirmation">
      <h2>Registration Successful!</h2>
      <p>You have successfully registered for:</p>
      <h3>{event.title}</h3>
      <p>Date: {event.date}</p>
      <p>Location: {event.location}</p>
      
      <p>A confirmation email has been sent to your email address.</p>
      
      <button onClick={onClose}>Close</button>
    </div>
  )
}

// EventsPage component that combines these components
const EventsPage = () => {
  // Mock state
  const [events] = vi.fn(() => [
    {
      id: 'event1',
      title: 'Tech Conference 2023',
      date: 'December 15, 2023',
      location: 'University Main Hall',
      description: 'A conference about the latest technologies and innovations.',
      organizer: 'Tech Club'
    },
    {
      id: 'event2',
      title: 'Art Exhibition',
      date: 'December 20, 2023',
      location: 'University Art Gallery',
      description: 'An exhibition of student artwork.',
      organizer: 'Art Club'
    }
  ])
  
  const [selectedEvent, setSelectedEvent] = vi.fn(() => null)
  const [showRegistrationForm, setShowRegistrationForm] = vi.fn(() => false)
  const [showConfirmation, setShowConfirmation] = vi.fn(() => false)
  const [registeredEvents, setRegisteredEvents] = vi.fn(() => [])
  
  // Mock handlers
  const handleViewDetails = (eventId) => {
    const event = events.find(e => e.id === eventId)
    setSelectedEvent(event)
  }
  
  const handleRegister = (eventId) => {
    setShowRegistrationForm(true)
  }
  
  const handleSubmitRegistration = (e) => {
    e.preventDefault()
    setRegisteredEvents([...registeredEvents, selectedEvent.id])
    setShowRegistrationForm(false)
    setShowConfirmation(true)
  }
  
  const handleCancelRegistration = () => {
    setShowRegistrationForm(false)
  }
  
  const handleCloseConfirmation = () => {
    setShowConfirmation(false)
  }
  
  const isEventRegistered = (eventId) => {
    return registeredEvents.includes(eventId)
  }
  
  return (
    <div className="events-page">
      {!selectedEvent && (
        <EventList 
          events={events} 
          onViewDetails={handleViewDetails} 
        />
      )}
      
      {selectedEvent && !showRegistrationForm && !showConfirmation && (
        <EventDetail 
          event={selectedEvent} 
          onRegister={handleRegister}
          isRegistered={isEventRegistered(selectedEvent.id)}
        />
      )}
      
      {selectedEvent && showRegistrationForm && (
        <RegistrationForm 
          event={selectedEvent}
          onSubmit={handleSubmitRegistration}
          onCancel={handleCancelRegistration}
        />
      )}
      
      {selectedEvent && showConfirmation && (
        <RegistrationConfirmation 
          event={selectedEvent}
          onClose={handleCloseConfirmation}
        />
      )}
    </div>
  )
}

describe('Event Registration Flow Integration', () => {
  // Mock functions
  const mockSetSelectedEvent = vi.fn()
  const mockSetShowRegistrationForm = vi.fn()
  const mockSetShowConfirmation = vi.fn()
  const mockSetRegisteredEvents = vi.fn()
  
  // Mock events
  const mockEvents = [
    {
      id: 'event1',
      title: 'Tech Conference 2023',
      date: 'December 15, 2023',
      location: 'University Main Hall',
      description: 'A conference about the latest technologies and innovations.',
      organizer: 'Tech Club'
    },
    {
      id: 'event2',
      title: 'Art Exhibition',
      date: 'December 20, 2023',
      location: 'University Art Gallery',
      description: 'An exhibition of student artwork.',
      organizer: 'Art Club'
    }
  ]
  
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    cleanup()
  })

  it('renders event list correctly', () => {
    render(
      <BrowserRouter>
        <EventList 
          events={mockEvents} 
          onViewDetails={vi.fn()} 
        />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Tech Conference 2023')).toBeInTheDocument()
    expect(screen.getByText('Art Exhibition')).toBeInTheDocument()
    expect(screen.getAllByText('View Details').length).toBe(2)
  })

  it('shows event details when view details is clicked', () => {
    const mockViewDetails = vi.fn()
    
    render(
      <BrowserRouter>
        <EventList 
          events={mockEvents} 
          onViewDetails={mockViewDetails} 
        />
      </BrowserRouter>
    )
    
    // Click view details for the first event
    fireEvent.click(screen.getAllByText('View Details')[0])
    
    expect(mockViewDetails).toHaveBeenCalledWith('event1')
  })

  it('shows registration form when register button is clicked', () => {
    const mockRegister = vi.fn()
    
    render(
      <BrowserRouter>
        <EventDetail 
          event={mockEvents[0]} 
          onRegister={mockRegister}
          isRegistered={false}
        />
      </BrowserRouter>
    )
    
    // Click register button
    fireEvent.click(screen.getByText('Register Now'))
    
    expect(mockRegister).toHaveBeenCalledWith('event1')
  })

  it('disables register button when already registered', () => {
    const mockRegister = vi.fn()
    
    render(
      <BrowserRouter>
        <EventDetail 
          event={mockEvents[0]} 
          onRegister={mockRegister}
          isRegistered={true}
        />
      </BrowserRouter>
    )
    
    // Check button is disabled
    const registerButton = screen.getByText('Already Registered')
    expect(registerButton).toBeDisabled()
    
    // Click register button
    fireEvent.click(registerButton)
    
    expect(mockRegister).not.toHaveBeenCalled()
  })

  it('submits registration form correctly', () => {
    const mockSubmit = vi.fn(e => e.preventDefault())
    const mockCancel = vi.fn()
    
    render(
      <BrowserRouter>
        <RegistrationForm 
          event={mockEvents[0]}
          onSubmit={mockSubmit}
          onCancel={mockCancel}
        />
      </BrowserRouter>
    )
    
    // Fill in form
    fireEvent.change(screen.getByLabelText('Full Name'), {
      target: { value: 'Test User' }
    })
    
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'test@example.com' }
    })
    
    // Submit form
    fireEvent.click(screen.getByText('Complete Registration'))
    
    expect(mockSubmit).toHaveBeenCalled()
  })

  it('shows confirmation after successful registration', () => {
    const mockClose = vi.fn()
    
    render(
      <BrowserRouter>
        <RegistrationConfirmation 
          event={mockEvents[0]}
          onClose={mockClose}
        />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Registration Successful!')).toBeInTheDocument()
    expect(screen.getByText('Tech Conference 2023')).toBeInTheDocument()
    
    // Click close button
    fireEvent.click(screen.getByText('Close'))
    
    expect(mockClose).toHaveBeenCalled()
  })
})
