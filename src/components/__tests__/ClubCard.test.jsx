import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

// Create a simple ClubCard component for testing
const ClubCard = ({ club, onFollow }) => {
  return (
    <div className="club-card">
      <div className="club-image">
        {club.logo ? (
          <img src={club.logo} alt={club.name} className="club-logo" />
        ) : (
          <div className="club-logo-placeholder">
            <span>{club.name.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="club-content">
        <h3 className="club-name">{club.name}</h3>
        <p className="club-description">{club.description}</p>
        <div className="club-tags">
          {club.tags && club.tags.map((tag, index) => (
            <span key={index} className="club-tag">{tag}</span>
          ))}
        </div>
        <div className="club-footer">
          <button 
            className="follow-button"
            onClick={() => onFollow(club.id)}
          >
            {club.isFollowing ? 'Unfollow' : 'Follow'}
          </button>
          <a href={`/club/${club.id}`} className="view-details">View Details</a>
        </div>
      </div>
    </div>
  )
}

describe('ClubCard Component', () => {
  const mockClub = {
    id: 'club1',
    name: 'Test Club',
    description: 'This is a test club description',
    tags: ['Technology', 'Programming'],
    logo: 'https://example.com/logo.jpg',
    isFollowing: false
  }
  
  const mockFollowFn = vi.fn()

  it('renders club details correctly', () => {
    render(
      <BrowserRouter>
        <ClubCard club={mockClub} onFollow={mockFollowFn} />
      </BrowserRouter>
    )
    
    expect(screen.getByText('Test Club')).toBeInTheDocument()
    expect(screen.getByText('This is a test club description')).toBeInTheDocument()
    expect(screen.getByText('Technology')).toBeInTheDocument()
    expect(screen.getByText('Programming')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'View Details' })).toBeInTheDocument()
    
    const logo = screen.getByAltText('Test Club')
    expect(logo).toBeInTheDocument()
    expect(logo.src).toBe('https://example.com/logo.jpg')
  })

  it('renders placeholder when logo is not provided', () => {
    const clubWithoutLogo = { ...mockClub, logo: null }
    
    render(
      <BrowserRouter>
        <ClubCard club={clubWithoutLogo} onFollow={mockFollowFn} />
      </BrowserRouter>
    )
    
    expect(screen.getByText('T')).toBeInTheDocument() // First letter of club name
    expect(screen.queryByAltText('Test Club')).not.toBeInTheDocument()
  })

  it('calls onFollow when follow button is clicked', () => {
    render(
      <BrowserRouter>
        <ClubCard club={mockClub} onFollow={mockFollowFn} />
      </BrowserRouter>
    )
    
    fireEvent.click(screen.getByRole('button', { name: 'Follow' }))
    expect(mockFollowFn).toHaveBeenCalledWith('club1')
  })

  it('shows unfollow button when club is already followed', () => {
    const followedClub = { ...mockClub, isFollowing: true }
    
    render(
      <BrowserRouter>
        <ClubCard club={followedClub} onFollow={mockFollowFn} />
      </BrowserRouter>
    )
    
    expect(screen.getByRole('button', { name: 'Unfollow' })).toBeInTheDocument()
  })
})
