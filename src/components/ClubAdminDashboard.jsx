import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, query, where, orderBy, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import './ClubAdminDashboard.css';

const ClubAdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEventForm, setShowEventForm] = useState(false);
  const [clubDetails, setClubDetails] = useState(null);

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

    if (!isLoggedIn || userRole !== 'club_admin') {
      navigate('/signin');
    } else {
      // Get club details
      const clubId = localStorage.getItem('clubId');
      const clubName = localStorage.getItem('clubName');

      setClubDetails({
        id: clubId,
        name: clubName
      });

      // Fetch events for this club
      fetchEvents(clubId);
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

        <motion.button
          className="create-event-button"
          onClick={() => setShowEventForm(!showEventForm)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showEventForm ? 'Cancel' : 'Create New Event'}
        </motion.button>
      </div>

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
            </motion.div>

            <h3>Past Events</h3>
            <motion.div
              className="events-list"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
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
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
};

export default ClubAdminDashboard;
