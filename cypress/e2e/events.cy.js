describe('Events Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage()
    
    // Set up a logged in user
    cy.window().then((window) => {
      window.localStorage.setItem('isLoggedIn', 'true')
      window.localStorage.setItem('userName', 'Test User')
      window.localStorage.setItem('userEmail', 'test@example.com')
    })
    
    cy.visit('/events')
  })

  it('should display list of events', () => {
    cy.contains('Upcoming Events').should('be.visible')
    cy.get('.event-card').should('have.length.at.least', 1)
  })

  it('should navigate to event details when clicking on an event', () => {
    cy.get('.event-card').first().find('button').contains('View Details').click()
    cy.url().should('include', '/events/')
    cy.get('.event-detail').should('be.visible')
  })

  it('should show registration form when clicking register button', () => {
    cy.get('.event-card').first().find('button').contains('View Details').click()
    cy.get('button').contains('Register Now').click()
    cy.get('.registration-form').should('be.visible')
  })

  it('should complete event registration successfully', () => {
    cy.get('.event-card').first().find('button').contains('View Details').click()
    cy.get('button').contains('Register Now').click()
    
    // Fill in registration form
    cy.get('input[id="name"]').type('Test User')
    cy.get('input[id="email"]').type('test@example.com')
    
    // Submit form
    cy.get('button').contains('Complete Registration').click()
    
    // Check confirmation is shown
    cy.get('.registration-confirmation').should('be.visible')
    cy.contains('Registration Successful!').should('be.visible')
  })

  it('should show already registered status after registration', () => {
    // First register for an event
    cy.get('.event-card').first().find('button').contains('View Details').click()
    cy.get('button').contains('Register Now').click()
    cy.get('input[id="name"]').type('Test User')
    cy.get('input[id="email"]').type('test@example.com')
    cy.get('button').contains('Complete Registration').click()
    cy.get('button').contains('Close').click()
    
    // Go back to event details
    cy.visit('/events')
    cy.get('.event-card').first().find('button').contains('View Details').click()
    
    // Check that register button is disabled
    cy.get('button').contains('Already Registered').should('be.disabled')
  })

  it('should filter events by category', () => {
    // Assuming there's a filter component
    cy.get('.event-filters').should('be.visible')
    cy.get('select#category-filter').select('Technology')
    
    // Check that filtered events are shown
    cy.get('.event-card').should('have.length.at.least', 1)
    cy.get('.event-card').first().should('contain', 'Technology')
  })

  it('should search for events', () => {
    // Assuming there's a search component
    cy.get('input[placeholder="Search events"]').type('Conference')
    cy.get('button').contains('Search').click()
    
    // Check that search results are shown
    cy.get('.event-card').should('have.length.at.least', 1)
    cy.get('.event-card').first().should('contain', 'Conference')
  })

  it('should show my registered events', () => {
    // First register for an event
    cy.get('.event-card').first().find('button').contains('View Details').click()
    cy.get('button').contains('Register Now').click()
    cy.get('input[id="name"]').type('Test User')
    cy.get('input[id="email"]').type('test@example.com')
    cy.get('button').contains('Complete Registration').click()
    cy.get('button').contains('Close').click()
    
    // Go to my events page
    cy.visit('/my-events')
    
    // Check that registered event is shown
    cy.get('.my-events-list').should('be.visible')
    cy.get('.event-card').should('have.length.at.least', 1)
  })
})
