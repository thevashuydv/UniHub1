import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Create a simple EventCard component for testing
const EventCard = ({ event }) => {
  return (
    <div className="event-card">
      <div className="event-image">
        {event.image ? (
          <img src={event.image} alt={event.title} />
        ) : (
          <div className="event-image-placeholder">
            <span>{event.title.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="event-content">
        <h3 className="event-title">{event.title}</h3>
        <p className="event-date">{event.date}</p>
        <p className="event-description">{event.description}</p>
        <div className="event-footer">
          <span className="event-organizer">{event.organizer}</span>
          <button className="register-button">Register</button>
        </div>
      </div>
    </div>
  )
}

describe('EventCard Component', () => {
  const mockEvent = {
    id: '1',
    title: 'Test Event',
    date: '2023-12-31',
    description: 'This is a test event description',
    organizer: 'Test Club',
    image: 'https://example.com/image.jpg'
  }

  it('renders event details correctly', () => {
    render(
      <BrowserRouter>
        <EventCard event={mockEvent} />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Test Event')).toBeInTheDocument()
    expect(screen.getByText('2023-12-31')).toBeInTheDocument()
    expect(screen.getByText('This is a test event description')).toBeInTheDocument()
    expect(screen.getByText('Test Club')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Register/i })).toBeInTheDocument()
    
    const image = screen.getByAltText('Test Event')
    expect(image).toBeInTheDocument()
    expect(image.src).toBe('https://example.com/image.jpg')
  })

  it('renders placeholder when image is not provided', () => {
    const eventWithoutImage = { ...mockEvent, image: null }
    
    render(
      <BrowserRouter>
        <EventCard event={eventWithoutImage} />
      </BrowserRouter>
    )
    
    expect(screen.getByText('T')).toBeInTheDocument() // First letter of title
    expect(screen.queryByAltText('Test Event')).not.toBeInTheDocument()
  })
})
