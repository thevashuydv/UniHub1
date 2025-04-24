/*
 * THIS FILE IS A REFERENCE IMPLEMENTATION FOR A SERVER-SIDE EMAIL SOLUTION
 * It is not currently being used due to CORS issues with the Resend API
 * The current implementation uses a mock email service that logs to the console
 * See src/utils/emailService.js for the current implementation
 */

const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
const port = process.env.PORT || 3002;

// Replace with your actual Resend API key
const resend = new Resend('re_YuUVEVUt_6Jxk4A5rGrkhdUtPAknFTY5d');

// Enable CORS for your frontend
app.use(cors({
  origin: ['http://localhost:5173', 'https://unihub-c1a9d.web.app', 'https://unihub-c1a9d.firebaseapp.com'], // Your frontend URLs
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Endpoint for sending event registration emails
app.post('/api/send-event-registration', async (req, res) => {
  try {
    const { userEmail, userName, eventName, eventDate, eventLocation, clubName } = req.body;

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Using Resend's default sender
      to: userEmail,
      subject: `Registration Confirmed: ${eventName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #646cff;">Event Registration Confirmation</h2>
          <p>Hello ${userName},</p>
          <p>Your registration for the following event has been confirmed:</p>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #646cff;">${eventName}</h3>
            <p><strong>Date & Time:</strong> ${eventDate}</p>
            <p><strong>Location:</strong> ${eventLocation}</p>
            <p><strong>Organized by:</strong> ${clubName}</p>
          </div>

          <p>We look forward to seeing you there!</p>
          <p>If you have any questions, please contact the event organizers.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
            <p>This is an automated message from UniHub. Please do not reply to this email.</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Failed to send event registration email:', error);
      return res.status(400).json({ success: false, error });
    }

    console.log('Event registration email sent successfully:', data);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error sending event registration email:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint for sending new event notification emails
app.post('/api/send-new-event-notification', async (req, res) => {
  try {
    const { userEmail, userName, eventName, eventDate, eventDescription, eventLocation, clubName } = req.body;

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Using Resend's default sender
      to: userEmail,
      subject: `New Event: ${eventName} by ${clubName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #646cff;">New Event Announcement</h2>
          <p>Hello ${userName},</p>
          <p>${clubName} has posted a new event that might interest you:</p>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #646cff;">${eventName}</h3>
            <p><strong>Date & Time:</strong> ${eventDate}</p>
            <p><strong>Location:</strong> ${eventLocation}</p>
            <p><strong>Description:</strong> ${eventDescription}</p>
          </div>

          <p>You're receiving this because you follow ${clubName}.</p>
          <p>We hope to see you there!</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
            <p>This is an automated message from UniHub. Please do not reply to this email.</p>
            <p>To stop receiving these notifications, unfollow the club on UniHub.</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Failed to send new event notification email:', error);
      return res.status(400).json({ success: false, error });
    }

    console.log('New event notification email sent successfully:', data);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error sending new event notification email:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint for sending announcement notification emails
app.post('/api/send-announcement-notification', async (req, res) => {
  try {
    const { userEmail, userName, announcementTitle, announcementContent, clubName } = req.body;

    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Using Resend's default sender
      to: userEmail,
      subject: `Announcement from ${clubName}: ${announcementTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #646cff;">Club Announcement</h2>
          <p>Hello ${userName},</p>
          <p>${clubName} has posted a new announcement:</p>

          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #646cff;">${announcementTitle}</h3>
            <div>${announcementContent}</div>
          </div>

          <p>You're receiving this because you follow ${clubName}.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
            <p>This is an automated message from UniHub. Please do not reply to this email.</p>
            <p>To stop receiving these notifications, unfollow the club on UniHub.</p>
          </div>
        </div>
      `
    });

    if (error) {
      console.error('Failed to send announcement notification email:', error);
      return res.status(400).json({ success: false, error });
    }

    console.log('Announcement notification email sent successfully:', data);
    return res.json({ success: true, data });
  } catch (error) {
    console.error('Error sending announcement notification email:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint for batch sending emails
app.post('/api/send-batch-emails', async (req, res) => {
  try {
    const { emailType, recipients } = req.body;

    if (!emailType || !recipients || !Array.isArray(recipients)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request. Required: emailType and recipients array'
      });
    }

    const results = {
      success: [],
      failed: []
    };

    // Process each recipient
    for (const recipient of recipients) {
      try {
        let result;

        // Call the appropriate function based on email type
        if (emailType === 'event-registration') {
          const { userEmail, userName, eventName, eventDate, eventLocation, clubName } = recipient;

          const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: userEmail,
            subject: `Registration Confirmed: ${eventName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2 style="color: #646cff;">Event Registration Confirmation</h2>
                <p>Hello ${userName},</p>
                <p>Your registration for the following event has been confirmed:</p>

                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #646cff;">${eventName}</h3>
                  <p><strong>Date & Time:</strong> ${eventDate}</p>
                  <p><strong>Location:</strong> ${eventLocation}</p>
                  <p><strong>Organized by:</strong> ${clubName}</p>
                </div>

                <p>We look forward to seeing you there!</p>
                <p>If you have any questions, please contact the event organizers.</p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                  <p>This is an automated message from UniHub. Please do not reply to this email.</p>
                </div>
              </div>
            `
          });

          result = { success: !error, data, error };

        } else if (emailType === 'new-event') {
          const { userEmail, userName, eventName, eventDate, eventDescription, eventLocation, clubName } = recipient;

          const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: userEmail,
            subject: `New Event: ${eventName} by ${clubName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2 style="color: #646cff;">New Event Announcement</h2>
                <p>Hello ${userName},</p>
                <p>${clubName} has posted a new event that might interest you:</p>

                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #646cff;">${eventName}</h3>
                  <p><strong>Date & Time:</strong> ${eventDate}</p>
                  <p><strong>Location:</strong> ${eventLocation}</p>
                  <p><strong>Description:</strong> ${eventDescription}</p>
                </div>

                <p>You're receiving this because you follow ${clubName}.</p>
                <p>We hope to see you there!</p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                  <p>This is an automated message from UniHub. Please do not reply to this email.</p>
                  <p>To stop receiving these notifications, unfollow the club on UniHub.</p>
                </div>
              </div>
            `
          });

          result = { success: !error, data, error };

        } else if (emailType === 'announcement') {
          const { userEmail, userName, announcementTitle, announcementContent, clubName } = recipient;

          const { data, error } = await resend.emails.send({
            from: 'onboarding@resend.dev',
            to: userEmail,
            subject: `Announcement from ${clubName}: ${announcementTitle}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2 style="color: #646cff;">Club Announcement</h2>
                <p>Hello ${userName},</p>
                <p>${clubName} has posted a new announcement:</p>

                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #646cff;">${announcementTitle}</h3>
                  <div>${announcementContent}</div>
                </div>

                <p>You're receiving this because you follow ${clubName}.</p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #777;">
                  <p>This is an automated message from UniHub. Please do not reply to this email.</p>
                  <p>To stop receiving these notifications, unfollow the club on UniHub.</p>
                </div>
              </div>
            `
          });

          result = { success: !error, data, error };

        } else {
          throw new Error(`Unknown email type: ${emailType}`);
        }

        if (result.success) {
          results.success.push(recipient.userEmail);
        } else {
          results.failed.push({ email: recipient.userEmail, error: result.error });
        }
      } catch (error) {
        results.failed.push({ email: recipient.userEmail, error: error.message });
      }
    }

    return res.json(results);
  } catch (error) {
    console.error('Error in batch email sending:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Email server running at http://localhost:${port}`);
});
