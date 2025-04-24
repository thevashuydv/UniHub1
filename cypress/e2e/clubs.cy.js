describe('Clubs Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage()
    
    // Set up a logged in user
    cy.window().then((window) => {
      window.localStorage.setItem('isLoggedIn', 'true')
      window.localStorage.setItem('userName', 'Test User')
      window.localStorage.setItem('userEmail', 'test@example.com')
    })
    
    cy.visit('/clubs')
  })

  it('should display list of clubs', () => {
    cy.contains('Discover Clubs').should('be.visible')
    cy.get('.club-card').should('have.length.at.least', 1)
  })

  it('should navigate to club details when clicking on a club', () => {
    cy.get('.club-card').first().find('a').contains('View Details').click()
    cy.url().should('include', '/club/')
    cy.get('.club-detail').should('be.visible')
  })

  it('should follow a club successfully', () => {
    // Click follow button on first club
    cy.get('.club-card').first().find('button').contains('Follow').click()
    
    // Button should change to "Unfollow"
    cy.get('.club-card').first().find('button').contains('Unfollow').should('be.visible')
  })

  it('should unfollow a club successfully', () => {
    // First follow a club
    cy.get('.club-card').first().find('button').contains('Follow').click()
    
    // Then unfollow it
    cy.get('.club-card').first().find('button').contains('Unfollow').click()
    
    // Button should change back to "Follow"
    cy.get('.club-card').first().find('button').contains('Follow').should('be.visible')
  })

  it('should filter clubs by category', () => {
    // Assuming there's a filter component
    cy.get('.club-filters').should('be.visible')
    cy.get('select#category-filter').select('Technology')
    
    // Check that filtered clubs are shown
    cy.get('.club-card').should('have.length.at.least', 1)
    cy.get('.club-card').first().should('contain', 'Technology')
  })

  it('should search for clubs', () => {
    // Assuming there's a search component
    cy.get('input[placeholder="Search clubs"]').type('Tech')
    cy.get('button').contains('Search').click()
    
    // Check that search results are shown
    cy.get('.club-card').should('have.length.at.least', 1)
    cy.get('.club-card').first().should('contain', 'Tech')
  })

  it('should show club events on club detail page', () => {
    cy.get('.club-card').first().find('a').contains('View Details').click()
    
    // Check that club events section is visible
    cy.get('.club-events').should('be.visible')
    cy.get('.event-card').should('have.length.at.least', 1)
  })

  it('should show followed clubs on my clubs page', () => {
    // First follow a club
    cy.get('.club-card').first().find('button').contains('Follow').click()
    
    // Go to my clubs page
    cy.visit('/my-clubs')
    
    // Check that followed club is shown
    cy.get('.my-clubs-list').should('be.visible')
    cy.get('.club-card').should('have.length.at.least', 1)
  })

  it('should show club admin dashboard for club admins', () => {
    // Set up a club admin user
    cy.window().then((window) => {
      window.localStorage.setItem('userRole', 'club_admin')
      window.localStorage.setItem('clubId', 'club1')
    })
    
    // Refresh to apply changes
    cy.reload()
    
    // Navigate to dashboard
    cy.get('a').contains('Dashboard').click()
    
    // Check that dashboard is shown
    cy.url().should('include', '/dashboard')
    cy.get('.admin-dashboard').should('be.visible')
    cy.contains('Club Admin Dashboard').should('be.visible')
  })
})
