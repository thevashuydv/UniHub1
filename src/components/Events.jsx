import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [followedClubs, setFollowedClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');

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
