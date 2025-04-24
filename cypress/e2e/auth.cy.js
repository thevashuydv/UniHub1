describe('Authentication Flow', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    cy.clearLocalStorage()
    cy.visit('/')
  })

  it('should navigate to sign in page', () => {
    cy.get('a').contains('Sign In').click()
    cy.url().should('include', '/auth')
    cy.contains('Sign In to Your Account').should('be.visible')
  })

  it('should navigate to sign up page', () => {
    cy.get('a').contains('Sign Up').click()
    cy.url().should('include', '/auth')
    cy.contains('Create Your Account').should('be.visible')
  })

  it('should show validation errors on empty sign up form submission', () => {
    cy.get('a').contains('Sign Up').click()
    cy.get('button[type="submit"]').contains('Create Account').click()
    
    // Browser validation should prevent submission
    // We can check if we're still on the same page
    cy.url().should('include', '/auth')
  })

  it('should show validation errors on empty sign in form submission', () => {
    cy.get('a').contains('Sign In').click()
    cy.get('button[type="submit"]').contains('Sign In').click()
    
    // Browser validation should prevent submission
    // We can check if we're still on the same page
    cy.url().should('include', '/auth')
  })

  it('should allow switching between sign in and sign up tabs', () => {
    cy.get('a').contains('Sign In').click()
    cy.contains('Sign In to Your Account').should('be.visible')
    
    cy.get('button').contains('Sign Up').click()
    cy.contains('Create Your Account').should('be.visible')
    
    cy.get('button').contains('Sign In').click()
    cy.contains('Sign In to Your Account').should('be.visible')
  })

  it('should redirect to home page after successful sign up', () => {
    // This test assumes your app has a mock or test mode
    // where you can bypass actual Firebase authentication
    cy.get('a').contains('Sign Up').click()
    
    // Fill in the form
    cy.get('input[id="name"]').type('Test User')
    cy.get('input[id="email"]').type('test@example.com')
    cy.get('input[id="password"]').type('password123')
    
    // Submit the form
    cy.get('button[type="submit"]').contains('Create Account').click()
    
    // Check redirection to home page
    // Note: This might need to be adjusted based on your actual implementation
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    
    // Check if user is logged in
    cy.contains('Welcome back').should('be.visible')
  })

  it('should redirect to home page after successful sign in', () => {
    // This test assumes your app has a mock or test mode
    // where you can bypass actual Firebase authentication
    cy.get('a').contains('Sign In').click()
    
    // Fill in the form
    cy.get('input[id="email"]').type('test@example.com')
    cy.get('input[id="password"]').type('password123')
    
    // Submit the form
    cy.get('button[type="submit"]').contains('Sign In').click()
    
    // Check redirection to home page
    // Note: This might need to be adjusted based on your actual implementation
    cy.url().should('eq', Cypress.config().baseUrl + '/')
    
    // Check if user is logged in
    cy.contains('Welcome back').should('be.visible')
  })

  it('should sign out successfully', () => {
    // First sign in
    cy.get('a').contains('Sign In').click()
    cy.get('input[id="email"]').type('test@example.com')
    cy.get('input[id="password"]').type('password123')
    cy.get('button[type="submit"]').contains('Sign In').click()
    
    // Check if user is logged in
    cy.contains('Welcome back').should('be.visible')
    
    // Sign out
    cy.get('button').contains('Sign Out').click()
    
    // Check if user is logged out
    cy.contains('Welcome to UniHub').should('be.visible')
    cy.contains('Join Now').should('be.visible')
  })
})
