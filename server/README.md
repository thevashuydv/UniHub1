# Email Server for UniHub

This directory contains a reference implementation for a server-side email solution using Resend.

## Current Status

This server is **not currently being used** in the application. The current implementation uses a mock email service that logs to the console instead of sending real emails.

## Why This Exists

The server-side implementation was created to solve CORS issues when trying to call the Resend API directly from the frontend. However, due to domain verification issues with Resend, we've temporarily switched to a mock implementation.

## How to Use This

When you're ready to implement real email sending:

1. Install the dependencies:
   ```bash
   npm install
   ```

2. Update the Resend API key and sender email in `server.js`

3. Start the server:
   ```bash
   node server.js
   ```

4. Update the `API_URL` in `src/utils/emailService.js` to point to this server

## Implementation Details

The server provides the following endpoints:

- `/api/send-event-registration`: Sends event registration confirmation emails
- `/api/send-new-event-notification`: Sends notifications about new events to club followers
- `/api/send-announcement-notification`: Sends notifications about club announcements to followers
- `/api/send-batch-emails`: Handles sending emails to multiple recipients

See the `server.js` file for the implementation details.
