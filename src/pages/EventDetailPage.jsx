import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '../firebase';
import FeedbackForm from '../components/FeedbackForm';
import FeedbackList from '../components/FeedbackList';
import DiscussionForm from '../components/DiscussionForm';
import DiscussionList from '../components/DiscussionList';
import './EventDetailPage.css';

const EventDetailPage = () => {
  const { eventId: rawEventId } = useParams();
  const navigate = useNavigate();

  // Ensure eventId is properly formatted
  const eventId = String(rawEventId);
  console.log('EventDetailPage - Received event ID:', rawEventId, 'Formatted:', eventId);

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('description');
  const [isRegistered, setIsRegistered] = useState(false);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState(false);
  const [feedbackList, setFeedbackList] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [averageRating, setAverageRating] = useState(0);
  const [userFeedback, setUserFeedback] = useState(null);
  const [isEditingFeedback, setIsEditingFeedback] = useState(false);
  const [discussionList, setDiscussionList] = useState([]);
  const [discussionLoading, setDiscussionLoading] = useState(false);

  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const userEmail = localStorage.getItem('userEmail');
  const isClubAdmin = localStorage.getItem('userRole') === 'club_admin';
  const adminClubId = localStorage.getItem('clubId');

  console.log('User auth status:', {
    isLoggedIn,
    userEmail,
    isClubAdmin,
    adminClubId,
    localStorageItems: {
      isLoggedIn: localStorage.getItem('isLoggedIn'),
      userEmail: localStorage.getItem('userEmail'),
      userRole: localStorage.getItem('userRole'),
      clubId: localStorage.getItem('clubId')
    }
  });

  // Fetch event details
  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        console.log('Fetching event details for ID:', eventId);

        const eventRef = doc(db, 'events', eventId);
        const eventSnap = await getDoc(eventRef);

        if (eventSnap.exists()) {
          const eventData = {
            id: eventSnap.id,
            ...eventSnap.data()
          };
          setEvent(eventData);
          console.log('Event data loaded:', eventData);

          // Check if user is registered for this event
          if (isLoggedIn && userEmail) {
            const registrationsRef = collection(db, 'event_registrations');
            const q = query(
              registrationsRef,
              where('eventId', '==', eventId),
              where('userEmail', '==', userEmail)
            );
            const registrationSnap = await getDocs(q);
            setIsRegistered(!registrationSnap.empty);
            console.log('User registration status:', !registrationSnap.empty);
          }

          // Always fetch feedback and discussions for this event, regardless of user role
          fetchFeedback(eventId);
          fetchDiscussions(eventId);
        } else {
          setError('Event not found');
          console.error('Event not found with ID:', eventId);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError('Failed to load event details. Please try again later.');
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId, isLoggedIn, userEmail]);

  // Fetch feedback for this event
  const fetchFeedback = async (eventId) => {
    try {
      setFeedbackLoading(true);
      console.log('Fetching feedback for event ID:', eventId);

      // First try with the compound query (requires an index)
      try {
        const feedbackRef = collection(db, 'event_feedback');
        const q = query(
          feedbackRef,
          where('eventId', '==', eventId),
          orderBy('createdAt', 'desc')
        );

        const feedbackSnap = await getDocs(q);
        const feedbackData = feedbackSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log('Feedback data loaded with compound query:', feedbackData.length, 'entries');
        processFeedbackData(feedbackData);
      } catch (indexError) {
        // If the compound query fails (likely due to missing index), fall back to a simpler query
        console.warn('Compound query failed, falling back to simple query:', indexError);

        const feedbackRef = collection(db, 'event_feedback');
        const simpleQuery = query(
          feedbackRef,
          where('eventId', '==', eventId)
        );

        const feedbackSnap = await getDocs(simpleQuery);
        let feedbackData = feedbackSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort manually in JavaScript
        feedbackData.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA; // descending order (newest first)
        });

        console.log('Feedback data loaded with fallback query:', feedbackData.length, 'entries');
        processFeedbackData(feedbackData);
      }

      setFeedbackLoading(false);
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setFeedbackLoading(false);
    }
  };

  // Process feedback data after fetching
  const processFeedbackData = (feedbackData) => {
    console.log('Processing feedback data:', feedbackData);
    setFeedbackList(feedbackData);

    // Check if user has already submitted feedback
    if (isLoggedIn && userEmail) {
      const existingFeedback = feedbackData.find(feedback => feedback.userEmail === userEmail);
      setHasSubmittedFeedback(!!existingFeedback);
      setUserFeedback(existingFeedback || null);
      console.log('User feedback status:', existingFeedback ? 'Found' : 'Not found');
    }

    // Calculate average rating
    if (feedbackData.length > 0) {
      const totalRating = feedbackData.reduce((sum, feedback) => sum + (feedback.rating || 0), 0);
      const avgRating = (totalRating / feedbackData.length).toFixed(1);
      setAverageRating(avgRating);
      console.log('Average rating calculated:', avgRating);
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

  // Check if event is past
  const isPastEvent = () => {
    if (!event) return false;
    const eventDate = new Date(event.eventDate);
    const now = new Date();
    console.log('Event date:', eventDate, 'Now:', now, 'Is past:', eventDate < now);
    return eventDate < now;
  };

  // Handle feedback submission success
  const handleFeedbackSubmitted = () => {
    setHasSubmittedFeedback(true);
    setIsEditingFeedback(false);
    fetchFeedback(eventId);
  };

  // Toggle edit mode for feedback
  const handleEditFeedback = () => {
    setIsEditingFeedback(true);
  };

  // Handle feedback deletion
  const handleFeedbackDeleted = () => {
    setHasSubmittedFeedback(false);
    setUserFeedback(null);
    fetchFeedback(eventId);
  };

  // Fetch discussions for this event
  const fetchDiscussions = async (eventId) => {
    try {
      setDiscussionLoading(true);
      console.log('Fetching discussions for event ID:', eventId);

      // First try with the compound query (requires an index)
      try {
        const discussionsRef = collection(db, 'event_discussions');
        const q = query(
          discussionsRef,
          where('eventId', '==', eventId),
          orderBy('createdAt', 'desc')
        );

        const discussionsSnap = await getDocs(q);
        const discussionsData = discussionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        console.log('Discussions data loaded with compound query:', discussionsData.length, 'entries');
        setDiscussionList(discussionsData);
      } catch (indexError) {
        // If the compound query fails (likely due to missing index), fall back to a simpler query
        console.warn('Compound query failed for discussions, falling back to simple query:', indexError);

        const discussionsRef = collection(db, 'event_discussions');
        const simpleQuery = query(
          discussionsRef,
          where('eventId', '==', eventId)
        );

        const discussionsSnap = await getDocs(simpleQuery);
        let discussionsData = discussionsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        // Sort manually in JavaScript
        discussionsData.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0);
          const dateB = new Date(b.createdAt || 0);
          return dateB - dateA; // descending order (newest first)
        });

        console.log('Discussions data loaded with fallback query:', discussionsData.length, 'entries');
        setDiscussionList(discussionsData);
      }

      setDiscussionLoading(false);
    } catch (err) {
      console.error('Error fetching discussions:', err);
      setDiscussionLoading(false);
    }
  };

  // Handle discussion submission
  const handleDiscussionSubmitted = () => {
    fetchDiscussions(eventId);
  };

  // Animation variants
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.5 } },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  if (loading) {
    return (
      <div className="event-detail-container">
        <div className="loading-spinner-container">
          <div className="loading-spinner"></div>
          <p>Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="event-detail-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <motion.button
            className="back-button"
            onClick={() => navigate('/events')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Events
          </motion.button>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="event-detail-container">
        <div className="error-message">
          <h2>Event Not Found</h2>
          <p>The event you're looking for doesn't exist or has been removed.</p>
          <motion.button
            className="back-button"
            onClick={() => navigate('/events')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Back to Events
          </motion.button>
        </div>
      </div>
    );
  }

  const isEventAdmin = isClubAdmin && adminClubId === event.clubId;
  console.log('Admin check:', {
    isClubAdmin,
    adminClubId,
    eventClubId: event.clubId,
    isEventAdmin,
    eventDetails: {
      id: event.id,
      name: event.name,
      clubId: event.clubId,
      clubName: event.clubName
    }
  });

  // Only show feedback tab for past events if user is registered or is the club admin
  const showFeedbackTab = isPastEvent() && (isRegistered || isEventAdmin);
  console.log('Show feedback tab:', { isPastEvent: isPastEvent(), isRegistered, isEventAdmin, showFeedbackTab });

  // Always show discussion tab if user is registered or is the club admin
  const showDiscussionTab = isRegistered || isEventAdmin;
  console.log('Show discussion tab:', { isRegistered, isEventAdmin, showDiscussionTab });

  // Determine if the user can submit feedback (registered user for past event)
  const canSubmitFeedback = isLoggedIn && isRegistered && isPastEvent() && !isEventAdmin;

  return (
    <motion.div
      className="event-detail-container"
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="event-detail-header">
        <div className="event-detail-title">
          <h1>{event.name}</h1>
          <div className="event-meta">
            <span className="event-club">{event.clubName}</span>
            <span className="event-category">{event.category}</span>
            {isPastEvent() && feedbackList.length > 0 && (
              <div className="event-rating">
                <span className="star-icon">★</span>
                <span>{averageRating}</span>
                <span className="rating-count">({feedbackList.length})</span>
              </div>
            )}
          </div>
        </div>

        <motion.button
          className="back-button"
          onClick={() => navigate('/events')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Back to Events
        </motion.button>
      </div>

      <div className="event-detail-tabs">
        <button
          className={`tab-button ${activeTab === 'description' ? 'active' : ''}`}
          onClick={() => setActiveTab('description')}
        >
          Description
        </button>

        {/* Only show feedback tab for past events if user is registered or is the club admin */}
        {showFeedbackTab && (
          <button
            className={`tab-button ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            Feedback {feedbackList.length > 0 && `(${feedbackList.length})`}
          </button>
        )}

        {/* Show discussion tab if user is registered or is the club admin */}
        {showDiscussionTab && (
          <button
            className={`tab-button ${activeTab === 'discussion' ? 'active' : ''}`}
            onClick={() => setActiveTab('discussion')}
          >
            Discussion {discussionList.length > 0 && `(${discussionList.length})`}
          </button>
        )}
      </div>

      <div className="event-detail-content">
        <AnimatePresence mode="wait">
          {activeTab === 'description' ? (
            <motion.div
              key="description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="event-description-tab"
            >
              <div className="event-detail-info">
                <div className="event-detail-item">
                  <span className="detail-label">Date & Time:</span>
                  <span className="detail-value">{formatDate(event.eventDate)}</span>
                </div>

                <div className="event-detail-item">
                  <span className="detail-label">Location:</span>
                  <span className="detail-value">{event.location}</span>
                </div>

                <div className="event-detail-item">
                  <span className="detail-label">Organized by:</span>
                  <span className="detail-value">{event.clubName}</span>
                </div>
              </div>

              <div className="event-description">
                <h3>About this event</h3>
                <p>{event.description}</p>
              </div>

              {isPastEvent() && isRegistered && !hasSubmittedFeedback && (
                <div className="feedback-prompt">
                  <p>You attended this event. Would you like to share your feedback?</p>
                  <motion.button
                    className="feedback-button"
                    onClick={() => setActiveTab('feedback')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Leave Feedback
                  </motion.button>
                </div>
              )}
            </motion.div>
          ) : activeTab === 'feedback' ? (
            <motion.div
              key="feedback"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="event-feedback-tab"
            >
              {/* Show feedback form for new submissions or when editing */}
              {canSubmitFeedback && (!hasSubmittedFeedback || isEditingFeedback) && (
                <FeedbackForm
                  eventId={eventId}
                  eventName={event.name}
                  onFeedbackSubmitted={handleFeedbackSubmitted}
                  existingFeedback={isEditingFeedback ? userFeedback : null}
                />
              )}

              {/* Show a message for club admins */}
              {isEventAdmin && (
                <div className="admin-feedback-message">
                  <p>As an event organizer, you can view all feedback submitted by attendees below.</p>
                </div>
              )}

              {/* Show submitted feedback message with edit option */}
              {canSubmitFeedback && hasSubmittedFeedback && !isEditingFeedback && (
                <div className="feedback-submitted-message">
                  <div className="feedback-message-content">
                    <p>Thank you for submitting your feedback for this event!</p>
                    <motion.button
                      className="edit-feedback-button"
                      onClick={handleEditFeedback}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      Edit My Feedback
                    </motion.button>
                  </div>
                </div>
              )}

              <FeedbackList
                feedbackList={feedbackList}
                loading={feedbackLoading}
                isEventAdmin={isEventAdmin}
                onFeedbackDeleted={handleFeedbackDeleted}
              />
            </motion.div>
          ) : (
            <motion.div
              key="discussion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="event-discussion-tab"
            >
              <DiscussionList
                discussionList={discussionList}
                loading={discussionLoading}
                isEventAdmin={isEventAdmin}
                isRegistered={isRegistered}
                eventId={eventId}
                eventName={event.name}
                onReplySubmitted={handleDiscussionSubmitted}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default EventDetailPage;
