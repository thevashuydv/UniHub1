import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, orderBy, getDocs, doc, deleteDoc, getDoc, updateDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import { sendNewEventNotificationEmail, sendAnnouncementNotificationEmail, sendBatchEmails } from '../utils/emailService';
import './ClubAdminDashboard.css';

const ClubAdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [clubDetails, setClubDetails] = useState(null);
  const [eventRegistrations, setEventRegistrations] = useState({});
  const [eventFeedback, setEventFeedback] = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showRegistrations, setShowRegistrations] = useState(false);

  // Club Info Management state
  const [showClubInfoForm, setShowClubInfoForm] = useState(false);
  const [clubInfoLoading, setClubInfoLoading] = useState(false);
  const [clubHead, setClubHead] = useState('');
  const [clubMembers, setClubMembers] = useState([]);
  const [clubInfoError, setClubInfoError] = useState('');
  const [clubInfoSuccess, setClubInfoSuccess] = useState('');

  // New member form state
  const [newMember, setNewMember] = useState({ name: '', position: '' });

  // Announcement form state
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementContent, setAnnouncementContent] = useState('');
  const [announcementError, setAnnouncementError] = useState('');
  const [announcementSuccess, setAnnouncementSuccess] = useState('');
  const [announcements, setAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [isEditingAnnouncement, setIsEditingAnnouncement] = useState(false);

  // Event form state
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventTime, setEventTime] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventCategory, setEventCategory] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const navigate = useNavigate();

  // Check if user is logged in as club admin
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userRole = localStorage.getItem('userRole');
    const userEmail = localStorage.getItem('userEmail');

    console.log('ClubAdminDashboard - Auth check:', { isLoggedIn, userRole, userEmail });

    if (!isLoggedIn || userRole !== 'club_admin') {
      console.log('Not authenticated as club admin, redirecting to signin');
      navigate('/signin');
    } else {
      // Get club details
      const clubId = localStorage.getItem('clubId');
      const clubName = localStorage.getItem('clubName');

      console.log('Club admin authenticated, club details:', { clubId, clubName });

      setClubDetails({
        id: clubId,
        name: clubName
      });

      // Fetch club details including club head and members
      fetchClubDetails(clubId);

      // Fetch events for this club
      fetchEvents(clubId);

      // Fetch announcements for this club
      fetchAnnouncements(clubId);
    }
  }, [navigate]);

  // Fetch events for this club
  const fetchEvents = async (clubId) => {
    try {
      setLoading(true);

      // Use a simpler query without orderBy to avoid requiring an index
      const eventsCollection = collection(db, 'events');
      const eventsQuery = query(
        eventsCollection,
        where('clubId', '==', clubId)
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsList = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Sort the events by date in JavaScript instead of in the query
      eventsList.sort((a, b) => {
        const dateA = new Date(a.eventDate);
        const dateB = new Date(b.eventDate);
        return dateA - dateB; // ascending order
      });

      setEvents(eventsList);
      setLoading(false);

      // Fetch registrations for each event
      eventsList.forEach(event => {
        fetchEventRegistrations(event.id);
      });

      // Fetch feedback for past events
      const pastEvents = eventsList.filter(event => !isUpcomingEvent(event.eventDate));
      if (pastEvents.length > 0) {
        fetchEventFeedback(pastEvents.map(event => event.id));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Validate form
    if (!eventName || !eventDescription || !eventDate || !eventTime || !eventLocation || !eventCategory) {
      setFormError('Please fill in all fields');
      return;
    }

    try {
      // Format date and time
      const eventDateTime = new Date(`${eventDate}T${eventTime}`);

      // Add event to Firestore
      const eventData = {
        name: eventName,
        description: eventDescription,
        eventDate: eventDateTime.toISOString(),
        location: eventLocation,
        category: eventCategory,
        clubId: clubDetails.id,
        clubName: clubDetails.name,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, 'events'), eventData);
      console.log('Event created with ID:', docRef.id);

      // Send notification emails to club followers
      try {
        // Fetch users who follow this club
        const userFollowsCollection = collection(db, 'user_follows');
        const q = query(userFollowsCollection, where('clubId', '==', clubDetails.id));
        const followsSnapshot = await getDocs(q);

        if (!followsSnapshot.empty) {
          console.log(`Sending event notification emails to ${followsSnapshot.size} followers`);

          // Prepare recipient list for batch email sending
          const recipients = followsSnapshot.docs.map(doc => {
            const followData = doc.data();
            return {
              userEmail: followData.userEmail,
              userName: followData.userName || 'Club Member', // Fallback if name not available
              eventName: eventName,
              eventDate: new Date(eventDateTime).toLocaleDateString(undefined, {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }),
              eventDescription: eventDescription,
              eventLocation: eventLocation,
              clubName: clubDetails.name
            };
          });

          // Send emails in batch
          const emailResults = await sendBatchEmails(sendNewEventNotificationEmail, recipients);
          console.log('Email sending results:', emailResults);
        }
      } catch (emailError) {
        console.error('Error sending event notification emails:', emailError);
        // Continue with event creation even if emails fail
      }

      // Clear form
      setEventName('');
      setEventDescription('');
      setEventDate('');
      setEventTime('');
      setEventLocation('');
      setEventCategory('');

      // Show success message
      setFormSuccess('Event created successfully!');

      // Refresh events list
      fetchEvents(clubDetails.id);

      // Hide form after successful submission
      setTimeout(() => {
        setShowEventForm(false);
        setFormSuccess('');
      }, 2000);

    } catch (error) {
      console.error('Error creating event:', error);
      setFormError('Failed to create event. Please try again.');
    }
  };

  // Fetch registrations for an event
  const fetchEventRegistrations = async (eventId) => {
    try {
      const registrationsRef = collection(db, 'event_registrations');
      const q = query(registrationsRef, where('eventId', '==', eventId));
      const querySnapshot = await getDocs(q);

      const registrations = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setEventRegistrations(prev => ({
        ...prev,
        [eventId]: registrations
      }));
    } catch (error) {
      console.error('Error fetching event registrations:', error);
    }
  };

  // View registrations for an event
  const viewRegistrations = (event) => {
    setSelectedEvent(event);
    setShowRegistrations(true);

    // Refresh registrations when viewing
    fetchEventRegistrations(event.id);
  };

  // Close registrations modal
  const closeRegistrations = () => {
    setShowRegistrations(false);
    setSelectedEvent(null);
  };

  // Export registrations to CSV
  const exportRegistrationsToCSV = (event, registrations) => {
    if (!registrations || registrations.length === 0) {
      alert('No registrations to export');
      return;
    }

    try {
      // Define CSV headers
      const headers = [
        'Event Name',
        'Participant Name',
        'Email',
        'Contact Number',
        'Registration Date',
        'Registration Time'
      ];

      // Convert registrations to CSV rows
      const rows = registrations.map(registration => {
        const registrationDate = new Date(registration.registeredAt);

        return [
          event.name,
          registration.userName,
          registration.userEmail,
          registration.userProfile?.contactNumber || 'N/A',
          registrationDate.toLocaleDateString(),
          registrationDate.toLocaleTimeString()
        ];
      });

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');

      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

      // Create a download link
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      // Set link properties
      link.setAttribute('href', url);
      link.setAttribute('download', `${event.name.replace(/\s+/g, '_')}_registrations.csv`);
      link.style.visibility = 'hidden';

      // Add link to document, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting registrations:', error);
      alert('Failed to export registrations. Please try again.');
    }
  };

  // Delete event
  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteDoc(doc(db, 'events', eventId));

        // Update local state
        setEvents(events.filter(event => event.id !== eventId));

        alert('Event deleted successfully');
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event. Please try again.');
      }
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Check if event is upcoming or past
  const isUpcomingEvent = (dateString) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    return eventDate > now;
  };

  // Check if event is past
  const isPastEvent = (dateString) => {
    const eventDate = new Date(dateString);
    const now = new Date();
    return eventDate < now;
  };

  // Fetch feedback for events
  const fetchEventFeedback = async (eventIds) => {
    try {
      console.log('Fetching feedback for events:', eventIds);
      const feedbackRef = collection(db, 'event_feedback');
      const feedbackData = {};

      // We need to fetch feedback for each event separately since Firestore doesn't support OR queries directly
      const feedbackPromises = eventIds.map(async (eventId) => {
        // Ensure eventId is a string
        const eventIdStr = String(eventId);
        console.log(`Fetching feedback for event ID: ${eventIdStr}`);

        const q = query(feedbackRef, where('eventId', '==', eventIdStr));
        const snapshot = await getDocs(q);

        console.log(`Found ${snapshot.docs.length} feedback entries for event ${eventIdStr}`);

        if (!snapshot.empty) {
          const feedbackItems = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          feedbackData[eventIdStr] = {
            count: snapshot.docs.length,
            totalRating: 0,
            averageRating: 0,
            feedback: feedbackItems
          };

          // Calculate average rating
          feedbackData[eventIdStr].totalRating = feedbackData[eventIdStr].feedback.reduce(
            (sum, item) => sum + (item.rating || 0), 0
          );

          feedbackData[eventIdStr].averageRating =
            feedbackData[eventIdStr].totalRating / feedbackData[eventIdStr].count;

          console.log(`Event ${eventIdStr} average rating: ${feedbackData[eventIdStr].averageRating}`);
        }
      });

      await Promise.all(feedbackPromises);
      console.log('All feedback data:', feedbackData);
      setEventFeedback(feedbackData);
    } catch (error) {
      console.error('Error fetching event feedback:', error);
    }
  };

  // Fetch detailed club information
  const fetchClubDetails = async (clubId) => {
    try {
      setClubInfoLoading(true);

      const clubRef = doc(db, 'clubs', clubId);
      const clubSnap = await getDoc(clubRef);

      if (clubSnap.exists()) {
        const clubData = clubSnap.data();

        // Update club details with all data
        setClubDetails({
          id: clubId,
          ...clubData
        });

        // Set club head if it exists
        if (clubData.clubHead) {
          setClubHead(clubData.clubHead);
        }

        // Set club members if they exist
        if (clubData.clubMembers) {
          if (Array.isArray(clubData.clubMembers)) {
            // Check if members have the new structure with name and position
            const hasStructuredMembers = clubData.clubMembers.length > 0 &&
              typeof clubData.clubMembers[0] === 'object' &&
              'name' in clubData.clubMembers[0];

            if (hasStructuredMembers) {
              // Use the structured members directly
              setClubMembers(clubData.clubMembers);
            } else {
              // Convert simple string array to structured format
              const structuredMembers = clubData.clubMembers.map(name => ({
                name,
                position: ''
              }));
              setClubMembers(structuredMembers);
            }
          } else {
            // Initialize with empty array if data format is invalid
            setClubMembers([]);
          }
        } else {
          // Initialize with empty array if no members exist
          setClubMembers([]);
        }
      }

      setClubInfoLoading(false);
    } catch (error) {
      console.error('Error fetching club details:', error);
      setClubInfoError('Failed to load club information. Please try again.');
      setClubInfoLoading(false);
    }
  };

  // Handle club info form submission
  const handleClubInfoSubmit = async (e) => {
    e.preventDefault();
    setClubInfoError('');
    setClubInfoSuccess('');

    try {
      setClubInfoLoading(true);

      // Validate members data
      const validMembers = clubMembers.filter(member => member.name.trim() !== '');

      // Update club document in Firestore
      const clubRef = doc(db, 'clubs', clubDetails.id);
      await updateDoc(clubRef, {
        clubHead: clubHead.trim(),
        clubMembers: validMembers,
        updatedAt: new Date().toISOString()
      });

      // Update local state
      setClubDetails({
        ...clubDetails,
        clubHead: clubHead.trim(),
        clubMembers: validMembers
      });

      setClubInfoSuccess('Club information updated successfully!');

      // Hide form after successful submission
      setTimeout(() => {
        setShowClubInfoForm(false);
        setClubInfoSuccess('');
      }, 2000);

      setClubInfoLoading(false);
    } catch (error) {
      console.error('Error updating club information:', error);
      setClubInfoError('Failed to update club information. Please try again.');
      setClubInfoLoading(false);
    }
  };

  // Handle adding a new member
  const handleAddMember = () => {
    if (newMember.name.trim() === '') {
      setClubInfoError('Member name cannot be empty');
      return;
    }

    setClubMembers([...clubMembers, { ...newMember }]);
    setNewMember({ name: '', position: '' }); // Reset form
    setClubInfoError('');
  };

  // Handle updating a member
  const handleUpdateMember = (index, field, value) => {
    const updatedMembers = [...clubMembers];
    updatedMembers[index] = { ...updatedMembers[index], [field]: value };
    setClubMembers(updatedMembers);
  };

  // Handle removing a member
  const handleRemoveMember = (index) => {
    const updatedMembers = clubMembers.filter((_, i) => i !== index);
    setClubMembers(updatedMembers);
  };

  // Toggle club info form
  const toggleClubInfoForm = () => {
    setShowClubInfoForm(!showClubInfoForm);
    setClubInfoError('');
    setClubInfoSuccess('');

    // Close other forms if open
    if (showEventForm) setShowEventForm(false);
    if (showAnnouncementForm) setShowAnnouncementForm(false);
  };

  // Fetch announcements for this club
  const fetchAnnouncements = async (clubId) => {
    try {
      setAnnouncementsLoading(true);
      console.log('Fetching announcements for club ID:', clubId);

      // First try with the compound query (requires an index)
      try {
        const announcementsCollection = collection(db, 'announcements');
        const announcementsQuery = query(
          announcementsCollection,
          where('clubId', '==', clubId),
          orderBy('createdAt', 'desc')
        );

        const announcementsSnapshot = await getDocs(announcementsQuery);
        const announcementsList = announcementsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log('Announcements fetched successfully:', announcementsList.length);
        setAnnouncements(announcementsList);
        setAnnouncementsLoading(false);
      } catch (indexError) {
        // If the compound query fails (likely due to missing index), fall back to a simpler query
        console.warn('Compound query failed, falling back to simple query:', indexError);

        const announcementsCollection = collection(db, 'announcements');
        const simpleQuery = query(
          announcementsCollection,
          where('clubId', '==', clubId)
        );

        const announcementsSnapshot = await getDocs(simpleQuery);
        let announcementsList = announcementsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort manually in JavaScript
        announcementsList.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA; // descending order (newest first)
        });

        console.log('Announcements fetched with fallback:', announcementsList.length);
        setAnnouncements(announcementsList);
        setAnnouncementsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
      setAnnouncementsLoading(false);
    }
  };

  // Toggle announcement form
  const toggleAnnouncementForm = () => {
    setShowAnnouncementForm(!showAnnouncementForm);
    setAnnouncementError('');
    setAnnouncementSuccess('');
    setSelectedAnnouncement(null);
    setIsEditingAnnouncement(false);
    setAnnouncementTitle('');
    setAnnouncementContent('');

    // Close other forms if open
    if (showEventForm) setShowEventForm(false);
    if (showClubInfoForm) setShowClubInfoForm(false);
  };

  // Handle announcement form submission
  const handleAnnouncementSubmit = async (e) => {
    e.preventDefault();
    setAnnouncementError('');
    setAnnouncementSuccess('');

    // Validate form
    if (!announcementTitle.trim()) {
      setAnnouncementError('Please enter an announcement title');
      return;
    }

    if (!announcementContent.trim()) {
      setAnnouncementError('Please enter announcement content');
      return;
    }

    try {
      setAnnouncementsLoading(true);

      // Ensure we have the club details
      if (!clubDetails || !clubDetails.id) {
        setAnnouncementError('Club information is missing. Please refresh the page and try again.');
        setAnnouncementsLoading(false);
        return;
      }

      console.log('Club details for announcement:', clubDetails);

      if (isEditingAnnouncement && selectedAnnouncement) {
        // Update existing announcement
        const announcementRef = doc(db, 'announcements', selectedAnnouncement.id);
        await updateDoc(announcementRef, {
          title: announcementTitle.trim(),
          content: announcementContent.trim(),
          updatedAt: new Date().toISOString()
        });

        setAnnouncementSuccess('Announcement updated successfully!');
      } else {
        // Create new announcement
        const announcementData = {
          clubId: clubDetails.id,
          clubName: clubDetails.name,
          title: announcementTitle.trim(),
          content: announcementContent.trim(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        console.log('Creating new announcement with data:', announcementData);
        const docRef = await addDoc(collection(db, 'announcements'), announcementData);
        console.log('Announcement created with ID:', docRef.id);

        // Add the new announcement to the local state immediately
        const newAnnouncement = {
          id: docRef.id,
          ...announcementData
        };

        setAnnouncements(prevAnnouncements => [newAnnouncement, ...prevAnnouncements]);
        setAnnouncementSuccess('Announcement posted successfully!');

        // Send notification emails to club followers
        try {
          // Fetch users who follow this club
          const userFollowsCollection = collection(db, 'user_follows');
          const q = query(userFollowsCollection, where('clubId', '==', clubDetails.id));
          const followsSnapshot = await getDocs(q);

          if (!followsSnapshot.empty) {
            console.log(`Sending announcement notification emails to ${followsSnapshot.size} followers`);

            // Prepare recipient list for batch email sending
            const recipients = followsSnapshot.docs.map(doc => {
              const followData = doc.data();
              return {
                userEmail: followData.userEmail,
                userName: followData.userName || 'Club Member', // Fallback if name not available
                announcementTitle: announcementTitle.trim(),
                announcementContent: announcementContent.trim(),
                clubName: clubDetails.name
              };
            });

            // Send emails in batch
            const emailResults = await sendBatchEmails(sendAnnouncementNotificationEmail, recipients);
            console.log('Announcement email sending results:', emailResults);
          }
        } catch (emailError) {
          console.error('Error sending announcement notification emails:', emailError);
          // Continue with announcement creation even if emails fail
        }
      }

      // Reset form
      setTimeout(() => {
        setAnnouncementTitle('');
        setAnnouncementContent('');
        setShowAnnouncementForm(false);
        setAnnouncementSuccess('');
        setIsEditingAnnouncement(false);
        setSelectedAnnouncement(null);
      }, 2000);

      // Refresh announcements list to ensure we have the latest data
      fetchAnnouncements(clubDetails.id);
      setAnnouncementsLoading(false);
    } catch (error) {
      console.error('Error posting announcement:', error);
      setAnnouncementError('Failed to post announcement. Please try again.');
      setAnnouncementsLoading(false);
    }
  };

  // Edit announcement
  const handleEditAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setAnnouncementTitle(announcement.title);
    setAnnouncementContent(announcement.content);
    setIsEditingAnnouncement(true);
    setShowAnnouncementForm(true);

    // Close other forms if open
    if (showEventForm) setShowEventForm(false);
    if (showClubInfoForm) setShowClubInfoForm(false);
  };

  // Delete announcement
  const handleDeleteAnnouncement = async (announcementId) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }

    try {
      setAnnouncementsLoading(true);
      console.log('Deleting announcement with ID:', announcementId);

      // Delete announcement from Firestore
      const announcementRef = doc(db, 'announcements', announcementId);
      await deleteDoc(announcementRef);
      console.log('Announcement deleted from Firestore');

      // Update local state
      setAnnouncements(announcements.filter(a => a.id !== announcementId));
      setAnnouncementSuccess('Announcement deleted successfully!');

      setTimeout(() => {
        setAnnouncementSuccess('');
      }, 2000);

      setAnnouncementsLoading(false);
    } catch (error) {
      console.error('Error deleting announcement:', error);
      setAnnouncementError('Failed to delete announcement. Please try again.');
      setAnnouncementsLoading(false);
    }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 100 }
    }
  };

  return (
    <div className="club-admin-dashboard">
      <div className="dashboard-header">
        <div className="dashboard-title">
          <h1>Club Admin Dashboard</h1>
          {clubDetails && <h2>{clubDetails.name}</h2>}
        </div>

        <div className="dashboard-actions">
          <motion.button
            className="manage-club-button"
            onClick={toggleClubInfoForm}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showClubInfoForm ? 'Cancel' : 'Manage Club Info'}
          </motion.button>

          <motion.button
            className="create-event-button"
            onClick={() => {
              setShowEventForm(!showEventForm);
              if (showAnnouncementForm) setShowAnnouncementForm(false);
              if (showClubInfoForm) setShowClubInfoForm(false);
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showEventForm ? 'Cancel' : 'Create New Event'}
          </motion.button>

          <motion.button
            className="announcement-button"
            onClick={toggleAnnouncementForm}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {showAnnouncementForm ? 'Cancel' : 'Post Announcement'}
          </motion.button>
        </div>
      </div>

      {/* Club Info Management Form */}
      {showClubInfoForm && (
        <motion.div
          className="club-info-form-container"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <h2>Manage Club Information</h2>

          {clubInfoError && <div className="form-error">{clubInfoError}</div>}
          {clubInfoSuccess && <div className="form-success">{clubInfoSuccess}</div>}

          {clubInfoLoading ? (
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
              <p>Loading club information...</p>
            </div>
          ) : (
            <form onSubmit={handleClubInfoSubmit} className="club-info-form">
              <div className="form-group">
                <label htmlFor="clubHead">Club Head / President</label>
                <input
                  type="text"
                  id="clubHead"
                  value={clubHead}
                  onChange={(e) => setClubHead(e.target.value)}
                  placeholder="Enter name of club head/president"
                  required
                />
              </div>

              <div className="form-group full-width">
                <label>Club Members</label>

                <div className="members-table-container">
                  {clubMembers.length > 0 ? (
                    <table className="members-table">
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Position/Role</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clubMembers.map((member, index) => (
                          <tr key={index}>
                            <td>
                              <input
                                type="text"
                                value={member.name}
                                onChange={(e) => handleUpdateMember(index, 'name', e.target.value)}
                                placeholder="Member name"
                                required
                              />
                            </td>
                            <td>
                              <input
                                type="text"
                                value={member.position}
                                onChange={(e) => handleUpdateMember(index, 'position', e.target.value)}
                                placeholder="Position/Role"
                              />
                            </td>
                            <td>
                              <motion.button
                                type="button"
                                className="remove-member-button"
                                onClick={() => handleRemoveMember(index)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Remove
                              </motion.button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-members-message">No members added yet. Use the form below to add members.</p>
                  )}
                </div>

                <div className="add-member-form">
                  <h4>Add New Member</h4>
                  <div className="add-member-inputs">
                    <input
                      type="text"
                      value={newMember.name}
                      onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                      placeholder="Member name"
                      className="member-name-input"
                    />
                    <input
                      type="text"
                      value={newMember.position}
                      onChange={(e) => setNewMember({ ...newMember, position: e.target.value })}
                      placeholder="Position/Role"
                      className="member-position-input"
                    />
                    <motion.button
                      type="button"
                      className="add-member-button"
                      onClick={handleAddMember}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Add Member
                    </motion.button>
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <motion.button
                  type="submit"
                  className="submit-button"
                  disabled={clubInfoLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {clubInfoLoading ? 'Saving...' : 'Save Club Information'}
                </motion.button>

                <motion.button
                  type="button"
                  className="cancel-button"
                  onClick={toggleClubInfoForm}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
              </div>
            </form>
          )}
        </motion.div>
      )}

      {/* Event Form */}
      {showEventForm && (
        <motion.div
          className="event-form-container"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <h2>Create New Event</h2>

          {formError && <div className="form-error">{formError}</div>}
          {formSuccess && <div className="form-success">{formSuccess}</div>}

          <form onSubmit={handleSubmit} className="event-form">
            <div className="form-group">
              <label htmlFor="eventName">Event Name</label>
              <input
                type="text"
                id="eventName"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Enter event name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="eventCategory">Category</label>
              <select
                id="eventCategory"
                value={eventCategory}
                onChange={(e) => setEventCategory(e.target.value)}
              >
                <option value="">Select a category</option>
                <option value="Workshop">Workshop</option>
                <option value="Seminar">Seminar</option>
                <option value="Competition">Competition</option>
                <option value="Social">Social</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="eventDate">Date</label>
              <input
                type="date"
                id="eventDate"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="eventTime">Time</label>
              <input
                type="time"
                id="eventTime"
                value={eventTime}
                onChange={(e) => setEventTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="eventLocation">Location</label>
              <input
                type="text"
                id="eventLocation"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="Enter event location"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="eventDescription">Description</label>
              <textarea
                id="eventDescription"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Enter event description"
                rows="4"
              />
            </div>

            <div className="form-actions">
              <motion.button
                type="submit"
                className="submit-button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Create Event
              </motion.button>

              <motion.button
                type="button"
                className="cancel-button"
                onClick={() => setShowEventForm(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Announcement Form */}
      {showAnnouncementForm && (
        <motion.div
          className="announcement-form-container"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <h2>{isEditingAnnouncement ? 'Edit Announcement' : 'Post New Announcement'}</h2>

          {announcementError && <div className="form-error">{announcementError}</div>}
          {announcementSuccess && <div className="form-success">{announcementSuccess}</div>}

          <form onSubmit={handleAnnouncementSubmit} className="announcement-form">
            <div className="form-group">
              <label htmlFor="announcementTitle">Announcement Title</label>
              <input
                type="text"
                id="announcementTitle"
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                placeholder="Enter announcement title"
                required
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="announcementContent">Announcement Content</label>
              <textarea
                id="announcementContent"
                value={announcementContent}
                onChange={(e) => setAnnouncementContent(e.target.value)}
                placeholder="Enter announcement content"
                rows="6"
                required
              />
            </div>

            <div className="form-actions">
              <motion.button
                type="submit"
                className="submit-button"
                disabled={announcementsLoading}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {announcementsLoading ? 'Saving...' : isEditingAnnouncement ? 'Update Announcement' : 'Post Announcement'}
              </motion.button>

              <motion.button
                type="button"
                className="cancel-button"
                onClick={toggleAnnouncementForm}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Club Info Display Section */}
      {!showClubInfoForm && !showEventForm && !showAnnouncementForm && (
        <motion.div
          className="club-info-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h2>Club Information</h2>

          <div className="club-info-display">
            <div className="info-card">
              <h3>Club Head / President</h3>
              <p>{clubDetails?.clubHead || 'Not specified'}</p>
              <motion.button
                className="edit-info-button"
                onClick={toggleClubInfoForm}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Edit Club Info
              </motion.button>
            </div>

            <div className="info-card members-card">
              <h3>Club Members</h3>
              {clubDetails?.clubMembers && clubDetails.clubMembers.length > 0 ? (
                <div className="members-table-view">
                  <table className="members-display-table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Position/Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.isArray(clubDetails.clubMembers) ? (
                        clubDetails.clubMembers.map((member, index) => (
                          <tr key={index}>
                            <td data-position={typeof member === 'object' ? (member.position || '-') : '-'}>
                              {typeof member === 'object' ? member.name : member}
                            </td>
                            <td>{typeof member === 'object' ? (member.position || '-') : '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2">Error: Members data format is invalid</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-members">No members added yet</p>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Announcements Section */}
      {!showClubInfoForm && !showEventForm && !showAnnouncementForm && (
        <motion.div
          className="announcements-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="section-header">
            <h2>Your Announcements</h2>
            <motion.button
              className="add-button"
              onClick={toggleAnnouncementForm}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Post New Announcement
            </motion.button>
          </div>

          {announcementError && <div className="form-error">{announcementError}</div>}
          {announcementSuccess && <div className="form-success">{announcementSuccess}</div>}

          {announcementsLoading ? (
            <div className="loading-spinner-container">
              <div className="loading-spinner"></div>
              <p>Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="no-items-message">
              <p>You haven't posted any announcements yet.</p>
              <p>Click the "Post New Announcement" button to get started!</p>
            </div>
          ) : (
            <motion.div
              className="announcements-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="event-cards-grid">
                {announcements.map(announcement => (
                  <motion.div
                    key={announcement.id}
                    className="announcement-card admin-view"
                    variants={itemVariants}
                    style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
                  >
                  <div className="announcement-card-header">
                    <h3>{announcement.title}</h3>
                    <div className="announcement-date">
                      {new Date(announcement.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="announcement-card-body">
                    <p className="announcement-content">{announcement.content}</p>
                  </div>

                  <div className="announcement-card-actions">
                    <motion.button
                      className="edit-button"
                      onClick={() => handleEditAnnouncement(announcement)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit
                    </motion.button>

                    <motion.button
                      className="delete-button"
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Delete
                    </motion.button>
                  </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}

      <div className="events-section">
        <h2>Your Events</h2>

        {loading ? (
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
            <p>Loading events...</p>
          </div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : events.length === 0 ? (
          <div className="no-events-message">
            <p>You haven't created any events yet.</p>
            <p>Click the "Create New Event" button to get started!</p>
          </div>
        ) : (
          <>
            <h3>Upcoming Events</h3>
            <motion.div
              className="events-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="event-cards-grid">
                {events
                  .filter(event => isUpcomingEvent(event.eventDate))
                  .map(event => (
                    <motion.div
                      key={event.id}
                      className="event-card upcoming"
                      variants={itemVariants}
                    >
                    <div className="event-card-header">
                      <h3>{event.name}</h3>
                      <div className="event-category">{event.category}</div>
                    </div>

                    <div className="event-card-body">
                      <p className="event-description">{event.description}</p>

                      <div className="event-details">
                        <div className="event-detail">
                          <span className="detail-icon">📅</span>
                          <span>{formatDate(event.eventDate)}</span>
                        </div>

                        <div className="event-detail">
                          <span className="detail-icon">📍</span>
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="event-card-actions">
                      <motion.button
                        className="view-registrations-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => viewRegistrations(event)}
                      >
                        View Registrations
                        {eventRegistrations[event.id] && (
                          <span className="registration-count">
                            {eventRegistrations[event.id].length}
                          </span>
                        )}
                      </motion.button>

                      {eventRegistrations[event.id]?.length > 0 && (
                        <motion.button
                          className="export-button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => exportRegistrationsToCSV(event, eventRegistrations[event.id])}
                        >
                          <span className="export-icon">📊</span> Export
                        </motion.button>
                      )}

                      <motion.button
                        className="edit-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => alert('Edit functionality coming soon!')}
                      >
                        Edit
                      </motion.button>

                      <motion.button
                        className="delete-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        Delete
                      </motion.button>
                    </div>
                  </motion.div>
                  ))}
              </div>
            </motion.div>

            <h3>Past Events</h3>
            <motion.div
              className="events-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="event-cards-grid">
                {events
                  .filter(event => !isUpcomingEvent(event.eventDate))
                  .map(event => (
                    <motion.div
                      key={event.id}
                      className="event-card past"
                      variants={itemVariants}
                    >
                    <div className="event-card-header">
                      <h3>{event.name}</h3>
                      <div className="event-category">{event.category}</div>
                    </div>

                    <div className="event-card-body">
                      <div className="event-details">
                        <div className="event-detail">
                          <span className="detail-icon">📅</span>
                          <span>{formatDate(event.eventDate)}</span>
                        </div>

                        <div className="event-detail">
                          <span className="detail-icon">📍</span>
                          <span>{event.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="event-card-actions">
                      <motion.button
                        className="view-registrations-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => viewRegistrations(event)}
                      >
                        View Registrations
                        {eventRegistrations[event.id] && (
                          <span className="registration-count">
                            {eventRegistrations[event.id].length}
                          </span>
                        )}
                      </motion.button>

                      {eventRegistrations[event.id]?.length > 0 && (
                        <motion.button
                          className="export-button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => exportRegistrationsToCSV(event, eventRegistrations[event.id])}
                        >
                          <span className="export-icon">📊</span> Export
                        </motion.button>
                      )}

                      <motion.button
                        className="delete-button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleDeleteEvent(event.id)}
                      >
                        Delete
                      </motion.button>

                      {isPastEvent(event.eventDate) && (
                        <motion.button
                          className="view-feedback-button"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent event bubbling
                            console.log('Navigating to event detail with ID:', event.id, 'Type:', typeof event.id);
                            // Ensure the ID is a string
                            const eventId = String(event.id);
                            console.log('Formatted event ID:', eventId);
                            navigate(`/events/${eventId}`);
                          }}
                        >
                          View Feedback
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                  ))}
              </div>
            </motion.div>
          </>
        )}
      </div>

      {/* Registrations Modal */}
      <AnimatePresence>
        {showRegistrations && selectedEvent && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="registrations-modal"
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.9 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 30
              }}
            >
            <div className="modal-header">
              <h2>Registrations for {selectedEvent.name}</h2>
              <div className="modal-actions">
                {eventRegistrations[selectedEvent.id]?.length > 0 && (
                  <motion.button
                    className="export-button"
                    onClick={() => exportRegistrationsToCSV(selectedEvent, eventRegistrations[selectedEvent.id])}
                    whileHover={{
                      scale: 1.05,
                      backgroundColor: 'rgba(255, 193, 7, 0.25)',
                      boxShadow: '0 6px 20px rgba(255, 193, 7, 0.2)',
                      color: 'white'
                    }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 15
                    }}
                  >
                    <span className="export-icon">📊</span> Export CSV
                  </motion.button>
                )}
                <motion.button
                  className="close-modal"
                  onClick={closeRegistrations}
                  whileHover={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    rotate: 90
                  }}
                  whileTap={{ scale: 0.9 }}
                >
                  &times;
                </motion.button>
              </div>
            </div>

            <div className="modal-content">
              {eventRegistrations[selectedEvent.id]?.length > 0 ? (
                <motion.div
                  className="registrations-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <motion.div
                    className="registrations-header"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: 0.2,
                      duration: 0.4,
                      type: 'spring',
                      stiffness: 300,
                      damping: 25
                    }}
                  >
                    <div className="reg-col">Profile</div>
                    <div className="reg-col">Name</div>
                    <div className="reg-col">Email</div>
                    <div className="reg-col">Registration Date</div>
                    <div className="reg-col">Actions</div>
                  </motion.div>

                  {eventRegistrations[selectedEvent.id].map((registration, index) => (
                    <motion.div
                      key={registration.id}
                      className="registration-item"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.3 + (index * 0.05),
                        type: 'spring',
                        stiffness: 200,
                        damping: 20
                      }}
                    >
                      <div className="reg-col profile-pic-col" data-label="Profile:">
                        <motion.div
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        >
                          {registration.userProfile?.profilePicture ? (
                            <motion.img
                              src={registration.userProfile.profilePicture}
                              alt={registration.userName}
                              className="registration-profile-pic"
                              onClick={() => navigate(`/user/user/${registration.userProfile?.id || registration.userEmail}`)}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              whileHover={{
                                boxShadow: '0 0 20px rgba(100, 108, 255, 0.5)',
                                borderColor: '#a5a9ff'
                              }}
                            />
                          ) : (
                            <motion.div
                              className="registration-profile-pic-placeholder"
                              onClick={() => navigate(`/user/user/${registration.userProfile?.id || registration.userEmail}`)}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                              whileHover={{
                                boxShadow: '0 0 20px rgba(100, 108, 255, 0.5)',
                                background: 'linear-gradient(135deg, #646cff, #a5a9ff)'
                              }}
                            >
                              {registration.userName ? registration.userName.charAt(0).toUpperCase() : '?'}
                            </motion.div>
                          )}
                        </motion.div>
                      </div>
                      <div className="reg-col" data-label="Name:">{registration.userName}</div>
                      <div className="reg-col" data-label="Email:">{registration.userEmail}</div>
                      <div className="reg-col" data-label="Registered:">
                        {new Date(registration.registeredAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                      <div className="reg-col" data-label="Actions:">
                        <motion.button
                          className="view-profile-button"
                          onClick={() => navigate(`/user/user/${registration.userProfile?.id || registration.userEmail}`)}
                          whileHover={{
                            scale: 1.05,
                            backgroundColor: 'rgba(100, 108, 255, 0.2)',
                            boxShadow: '0 5px 15px rgba(100, 108, 255, 0.3)'
                          }}
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            type: 'spring',
                            stiffness: 500,
                            damping: 15,
                            delay: 0.1
                          }}
                        >
                          <span className="button-icon">👤</span> View Profile
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  className="no-registrations"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: 0.2,
                    type: 'spring',
                    stiffness: 200,
                    damping: 20
                  }}
                >
                  <p>No registrations for this event yet.</p>
                </motion.div>
              )}
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClubAdminDashboard;
