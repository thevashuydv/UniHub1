import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, addDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [followedClubs, setFollowedClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [registeredEvents, setRegisteredEvents] = useState([]);
  const [registrationLoading, setRegistrationLoading] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(null);
  const [unregistrationSuccess, setUnregistrationSuccess] = useState(null);
  const [registrationIds, setRegistrationIds] = useState({});
  const [userProfile, setUserProfile] = useState(null);

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName');

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!isLoggedIn || !userEmail) return;

      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', userEmail));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUserProfile({
            id: querySnapshot.docs[0].id,
            ...userData
          });
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, [isLoggedIn, userEmail]);

  // Fetch user's event registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!isLoggedIn || !userEmail) return;

      try {
        const registrationsRef = collection(db, 'event_registrations');
        const q = query(registrationsRef, where('userEmail', '==', userEmail));
        const querySnapshot = await getDocs(q);

        const registeredEventIds = [];
        const registrationIdsMap = {};

        querySnapshot.docs.forEach(doc => {
          const eventId = doc.data().eventId;
          registeredEventIds.push(eventId);
          registrationIdsMap[eventId] = doc.id;
        });

        setRegisteredEvents(registeredEventIds);
        setRegistrationIds(registrationIdsMap);
      } catch (error) {
        console.error('Error fetching event registrations:', error);
      }
    };

    fetchRegistrations();
  }, [isLoggedIn, userEmail]);

  // Fetch user's followed clubs
  useEffect(() => {
    const fetchFollowedClubs = async () => {
      if (!isLoggedIn || !userEmail) {
        setLoading(false);
        return;
      }

      try {
        const userFollowsCollection = collection(db, 'user_follows');
        const q = query(userFollowsCollection, where('userEmail', '==', userEmail));
        const followsSnapshot = await getDocs(q);

        const clubIds = followsSnapshot.docs.map(doc => ({
          id: doc.data().clubId,
          name: doc.data().clubName
        }));

        setFollowedClubs(clubIds);

        // After getting followed clubs, fetch their events
        if (clubIds.length > 0) {
          fetchEvents(clubIds.map(club => club.id));
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching followed clubs:', error);
        setError('Failed to load your followed clubs. Please try again later.');
        setLoading(false);
      }
    };

    fetchFollowedClubs();
  }, [isLoggedIn, userEmail]);

  // Fetch events from followed clubs
  const fetchEvents = async (clubIds) => {
    try {
      setLoading(true);

      // If no clubs are followed, don't fetch any events
      if (clubIds.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const eventsCollection = collection(db, 'events');

      // We need to use multiple queries since Firestore doesn't support OR queries directly
      const eventPromises = clubIds.map(clubId => {
        const clubEventsQuery = query(eventsCollection, where('clubId', '==', clubId));
        return getDocs(clubEventsQuery);
      });

      const eventSnapshots = await Promise.all(eventPromises);

      // Combine results from all queries
      let allEvents = [];
      eventSnapshots.forEach(snapshot => {
        const clubEvents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        allEvents = [...allEvents, ...clubEvents];
      });

      // Sort events by date
      allEvents.sort((a, b) => {
        const dateA = new Date(a.eventDate);
        const dateB = new Date(b.eventDate);
        return dateA - dateB; // ascending order
      });

      setEvents(allEvents);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setError('Failed to load events. Please try again later.');
      setLoading(false);
    }
  };

  // Check if user is registered for an event
  const isRegistered = (eventId) => {
    return registeredEvents.includes(eventId);
  };

  // Handle event registration
  const handleRegister = async (event) => {
    if (!isLoggedIn) {
      alert('Please sign in to register for events');
      return;
    }

    if (isRegistered(event.id)) {
      alert('You are already registered for this event');
      return;
    }

    try {
      // Set loading state for this specific event
      setRegistrationLoading(prev => ({
        ...prev,
        [event.id]: true
      }));

      // Create registration document
      const registrationData = {
        eventId: event.id,
        eventName: event.name,
        clubId: event.clubId,
        clubName: event.clubName,
        userEmail: userEmail,
        userName: userName,
        userProfile: userProfile || { name: userName, email: userEmail },
        registeredAt: new Date().toISOString()
      };

      // Add registration to Firestore
      const docRef = await addDoc(collection(db, 'event_registrations'), registrationData);

      // Update local state
      setRegisteredEvents([...registeredEvents, event.id]);
      setRegistrationIds(prev => ({
        ...prev,
        [event.id]: docRef.id
      }));

      // Show success message
      setRegistrationSuccess({
        eventId: event.id,
        eventName: event.name
      });

      // Clear any unregistration message
      setUnregistrationSuccess(null);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setRegistrationSuccess(null);
      }, 5000);

      // Clear loading state for this event
      setRegistrationLoading(prev => {
        const updated = { ...prev };
        delete updated[event.id];
        return updated;
      });
    } catch (error) {
      console.error('Error registering for event:', error);
      alert('Failed to register for event. Please try again.');
      // Clear loading state for this event
      setRegistrationLoading(prev => {
        const updated = { ...prev };
        delete updated[event.id];
        return updated;
      });
    }
  };

  // Handle event unregistration
  const handleUnregister = async (event) => {
    if (!isLoggedIn) {
      alert('Please sign in to manage your registrations');
      return;
    }

    if (!isRegistered(event.id)) {
      alert('You are not registered for this event');
      return;
    }

    try {
      // Set loading state for this specific event
      setRegistrationLoading(prev => ({
        ...prev,
        [event.id]: true
      }));

      // Get the registration document ID
      const registrationId = registrationIds[event.id];

      if (!registrationId) {
        throw new Error('Registration not found');
      }

      // Delete the registration document from Firestore
      await deleteDoc(doc(db, 'event_registrations', registrationId));

      // Update local state
      const updatedRegisteredEvents = registeredEvents.filter(id => id !== event.id);
      setRegisteredEvents(updatedRegisteredEvents);

      // Update registration IDs
      const updatedRegistrationIds = { ...registrationIds };
      delete updatedRegistrationIds[event.id];
      setRegistrationIds(updatedRegistrationIds);

      // Show success message
      setUnregistrationSuccess({
        eventId: event.id,
        eventName: event.name
      });

      // Clear any registration message
      setRegistrationSuccess(null);

      // Hide success message after 5 seconds
      setTimeout(() => {
        setUnregistrationSuccess(null);
      }, 5000);

      // Clear loading state for this event
      setRegistrationLoading(prev => {
        const updated = { ...prev };
        delete updated[event.id];
        return updated;
      });
    } catch (error) {
      console.error('Error unregistering from event:', error);
      alert('Failed to unregister from event. Please try again.');
      // Clear loading state for this event
      setRegistrationLoading(prev => {
        const updated = { ...prev };
        delete updated[event.id];
        return updated;
      });
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

  // Check if event is upcoming, happening today, or past
  const getEventStatus = (dateString) => {
    const eventDate = new Date(dateString);
    const now = new Date();

    // Set time to beginning of day for comparison
    const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (eventDay.getTime() === today.getTime()) {
      return 'today';
    } else if (eventDate > now) {
      return 'upcoming';
    } else {
      return 'past';
    }
  };

  // Filter events based on search term and active filter
  const filteredEvents = events.filter(event => {
    // Filter by search term
    const matchesSearch =
      event.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      event.clubName?.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by event status
    const status = getEventStatus(event.eventDate);
    const matchesFilter =
      activeFilter === 'all' ||
      (activeFilter === 'today' && status === 'today') ||
      (activeFilter === 'upcoming' && status === 'upcoming') ||
      (activeFilter === 'past' && status === 'past');

    return matchesSearch && matchesFilter;
  });

  // Group events by date for better organization
  const groupEventsByDate = (events) => {
    const grouped = {};

    events.forEach(event => {
      const date = new Date(event.eventDate).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(event);
    });

    // Convert to array and sort by date
    return Object.entries(grouped)
      .map(([date, events]) => ({ date, events }))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const groupedEvents = groupEventsByDate(filteredEvents);

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
    <div className="events-container">
      <div className="events-header">
        <h1 className="events-title">Upcoming <span className="text-gradient">Events</span></h1>
        <p className="events-subtitle">
          {isLoggedIn
            ? 'Stay updated with events from clubs you follow'
            : 'Sign in to see events from clubs you follow'}
        </p>

        <div className="events-filters">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="event-search-input"
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-button ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Events
            </button>
            <button
              className={`filter-button ${activeFilter === 'today' ? 'active' : ''}`}
              onClick={() => setActiveFilter('today')}
            >
              Today
            </button>
            <button
              className={`filter-button ${activeFilter === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveFilter('upcoming')}
            >
              Upcoming
            </button>
            <button
              className={`filter-button ${activeFilter === 'past' ? 'active' : ''}`}
              onClick={() => setActiveFilter('past')}
            >
              Past
            </button>
          </div>
        </div>
      </div>

      <div className="events-content">
        {loading ? (
          <div className="events-loading">
            <div className="loading-spinner"></div>
            <p>Loading events...</p>
          </div>
        ) : error ? (
          <div className="events-error">{error}</div>
        ) : !isLoggedIn ? (
          <div className="events-not-logged-in">
            <p>Please sign in to see events from clubs you follow.</p>
            <motion.button
              className="sign-in-button"
              onClick={() => window.location.href = '/signin'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign In
            </motion.button>
          </div>
        ) : followedClubs.length === 0 ? (
          <div className="no-followed-clubs">
            <p>You haven't followed any clubs yet.</p>
            <p>Follow clubs to see their events here!</p>
            <motion.button
              className="browse-clubs-button"
              onClick={() => window.location.href = '/clubs'}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Browse Clubs
            </motion.button>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="no-events-message">
            <p>No events found matching your criteria.</p>
            {activeFilter !== 'all' && (
              <p>
                Try changing your filter or
                <button
                  className="reset-filter-button"
                  onClick={() => setActiveFilter('all')}
                >
                  view all events
                </button>
              </p>
            )}
          </div>
        ) : (
          <motion.div
            className="events-list"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {groupedEvents.map(group => (
              <div key={group.date} className="event-date-group">
                <h3 className="event-date-header">{new Date(group.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</h3>

                {group.events.map(event => {
                  const eventStatus = getEventStatus(event.eventDate);

                  return (
                    <motion.div
                      key={event.id}
                      className={`event-card ${eventStatus}`}
                      variants={itemVariants}
                    >
                      <div className="event-card-header">
                        <div className="event-info">
                          <h3 className="event-name">{event.name}</h3>
                          <div className="event-meta">
                            <span className="event-club">{event.clubName}</span>
                            <span className="event-category">{event.category}</span>
                            {eventStatus === 'today' && <span className="event-today-badge">Today</span>}
                          </div>
                        </div>
                        <div className="event-time">
                          {new Date(event.eventDate).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>

                      <div className="event-card-body">
                        <p className="event-description">{event.description}</p>

                        <div className="event-details">
                          <div className="event-detail">
                            <span className="detail-icon">📍</span>
                            <span>{event.location}</span>
                          </div>
                        </div>

                        {(eventStatus === 'upcoming' || eventStatus === 'today') && (
                          <div className="event-card-actions">
                            {isRegistered(event.id) ? (
                              <motion.button
                                className="unregister-button"
                                onClick={() => handleUnregister(event)}
                                disabled={!!registrationLoading[event.id]}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {registrationLoading[event.id] ? 'Processing...' : 'Unregister'}
                              </motion.button>
                            ) : (
                              <motion.button
                                className="register-button"
                                onClick={() => handleRegister(event)}
                                disabled={!!registrationLoading[event.id]}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                {registrationLoading[event.id] ? 'Processing...' : 'Register'}
                              </motion.button>
                            )}
                          </div>
                        )}

                        <AnimatePresence>
                          {registrationSuccess && registrationSuccess.eventId === event.id && (
                            <motion.div
                              className="registration-confirmation success"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              key="registration-success"
                            >
                              <span className="confirmation-icon">✓</span>
                              <span>Successfully registered for {registrationSuccess.eventName}!</span>
                            </motion.div>
                          )}

                          {unregistrationSuccess && unregistrationSuccess.eventId === event.id && (
                            <motion.div
                              className="registration-confirmation unregistered"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0 }}
                              key="unregistration-success"
                            >
                              <span className="confirmation-icon">✓</span>
                              <span>Successfully unregistered from {unregistrationSuccess.eventName}!</span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Events;
