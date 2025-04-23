// API URL for our backend proxy server that uses SendGrid
const API_URL = 'http://localhost:3003/api';

export const initEmailService = () => {
  console.log('SendGrid email service ready');
  // Check if the server is running
  fetch(`${API_URL}/health`)
    .then(response => response.json())
    .then(data => console.log('Email server status:', data))
    .catch(error => console.error('Email server not available:', error));
};

/**
 * Send event registration confirmation email
 * @param {Object} params - Email parameters
 * @param {string} params.userEmail - User's email address
 * @param {string} params.userName - User's name
 * @param {string} params.eventName - Name of the event
 * @param {string} params.eventDate - Date of the event
 * @param {string} params.eventLocation - Location of the event
 * @param {string} params.clubName - Name of the club hosting the event
 */
export const sendEventRegistrationEmail = async (params) => {
  try {
    const response = await fetch(`${API_URL}/send-event-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    const result = await response.json();

    if (!result.success) {
      console.error('Failed to send event registration email:', result.error);
      return { success: false, error: result.error };
    }

    console.log('Event registration email sent successfully:', result.data);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error sending event registration email:', error);
    return { success: false, error };
  }
};

/**
 * Send notification about new event to followers
 * @param {Object} params - Email parameters
 * @param {string} params.userEmail - User's email address
 * @param {string} params.userName - User's name
 * @param {string} params.eventName - Name of the event
 * @param {string} params.eventDate - Date of the event
 * @param {string} params.eventDescription - Description of the event
 * @param {string} params.eventLocation - Location of the event
 * @param {string} params.clubName - Name of the club hosting the event
 */
export const sendNewEventNotificationEmail = async (params) => {
  try {
    const response = await fetch(`${API_URL}/send-new-event-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    const result = await response.json();

    if (!result.success) {
      console.error('Failed to send new event notification email:', result.error);
      return { success: false, error: result.error };
    }

    console.log('New event notification email sent successfully:', result.data);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error sending new event notification email:', error);
    return { success: false, error };
  }
};

/**
 * Send announcement notification email to followers
 * @param {Object} params - Email parameters
 * @param {string} params.userEmail - User's email address
 * @param {string} params.userName - User's name
 * @param {string} params.announcementTitle - Title of the announcement
 * @param {string} params.announcementContent - Content of the announcement
 * @param {string} params.clubName - Name of the club making the announcement
 */
export const sendAnnouncementNotificationEmail = async (params) => {
  try {
    const response = await fetch(`${API_URL}/send-announcement-notification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    });

    const result = await response.json();

    if (!result.success) {
      console.error('Failed to send announcement notification email:', result.error);
      return { success: false, error: result.error };
    }

    console.log('Announcement notification email sent successfully:', result.data);
    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error sending announcement notification email:', error);
    return { success: false, error };
  }
};

/**
 * Send batch emails to multiple recipients
 * @param {Function} emailFunction - The email sending function to use
 * @param {Array} recipientsList - List of recipient objects
 */
export const sendBatchEmails = async (emailFunction, recipientsList) => {
  // Determine which email type to use based on the function name
  let emailType = '';
  if (emailFunction === sendEventRegistrationEmail) {
    emailType = 'event-registration';
  } else if (emailFunction === sendNewEventNotificationEmail) {
    emailType = 'new-event';
  } else if (emailFunction === sendAnnouncementNotificationEmail) {
    emailType = 'announcement';
  } else {
    throw new Error('Unknown email function');
  }

  try {
    const response = await fetch(`${API_URL}/send-batch-emails`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        emailType,
        recipients: recipientsList
      })
    });

    const results = await response.json();
    console.log('Batch email results:', results);
    return results;
  } catch (error) {
    console.error('Error in batch email sending:', error);
    return {
      success: [],
      failed: recipientsList.map(recipient => ({
        email: recipient.userEmail,
        error: error.message
      }))
    };
  }
};
