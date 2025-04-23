import { motion } from 'framer-motion';
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import './FeedbackList.css';

const FeedbackList = ({ feedbackList, loading, isEventAdmin, onFeedbackDeleted }) => {
  const userEmail = localStorage.getItem('userEmail');
  // Format date for display
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
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

  if (loading) {
    return (
      <div className="feedback-loading">
        <div className="loading-spinner"></div>
        <p>Loading feedback...</p>
      </div>
    );
  }

  console.log('Rendering feedback list:', {
    feedbackCount: feedbackList.length,
    isEventAdmin,
    feedbackList
  });

  if (feedbackList.length === 0) {
    return (
      <div className="no-feedback-message">
        <p>{isEventAdmin ? 'No feedback has been submitted for this event yet.' : 'Be the first to leave feedback for this event!'}</p>
      </div>
    );
  }

  return (
    <div className="feedback-list-container">
      <h3>Event Feedback {isEventAdmin && `(${feedbackList.length})`}</h3>

      {isEventAdmin && (
        <div className="feedback-summary">
          <div className="average-rating">
            <span className="rating-label">Average Rating:</span>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => {
                const averageRating = feedbackList.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbackList.length;
                return (
                  <span
                    key={star}
                    className={`summary-star ${star <= Math.round(averageRating) ? 'active' : ''}`}
                  >
                    ★
                  </span>
                );
              })}
              <span className="rating-value">
                {(feedbackList.reduce((sum, feedback) => sum + feedback.rating, 0) / feedbackList.length).toFixed(1)}
              </span>
            </div>
          </div>

          <div className="rating-distribution">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = feedbackList.filter(feedback => feedback.rating === rating).length;
              const percentage = Math.round((count / feedbackList.length) * 100);

              return (
                <div key={rating} className="rating-bar">
                  <div className="rating-label">{rating} ★</div>
                  <div className="rating-progress">
                    <div
                      className="rating-progress-fill"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="rating-percentage">{percentage}%</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <motion.div
        className="feedback-items"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {feedbackList.map((feedback) => (
          <motion.div
            key={feedback.id}
            className="feedback-item"
            variants={itemVariants}
          >
            <div className="feedback-header">
              <div className="feedback-user">
                <div className="user-avatar">
                  {feedback.userName ? feedback.userName.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-info">
                  <div className="user-name">{feedback.userName || 'Anonymous'}</div>
                  {isEventAdmin && (
                    <div className="user-email">{feedback.userEmail}</div>
                  )}
                  <div className="feedback-date">
                    {formatDate(feedback.createdAt)}
                    {feedback.updatedAt && feedback.updatedAt !== feedback.createdAt && (
                      <span className="edited-label"> (edited)</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="feedback-rating">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`feedback-star ${star <= feedback.rating ? 'active' : ''}`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>

            {feedback.comment && (
              <div className="feedback-comment">
                <p>{feedback.comment}</p>
              </div>
            )}

            {/* Show delete button only for the user's own feedback */}
            {userEmail === feedback.userEmail && !isEventAdmin && (
              <div className="feedback-actions">
                <motion.button
                  className="delete-feedback-button"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to delete your feedback?')) {
                      try {
                        await deleteDoc(doc(db, 'event_feedback', feedback.id));
                        console.log('Feedback deleted successfully');
                        if (onFeedbackDeleted) {
                          onFeedbackDeleted();
                        }
                      } catch (error) {
                        console.error('Error deleting feedback:', error);
                        alert('Failed to delete feedback. Please try again.');
                      }
                    }
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Delete My Feedback
                </motion.button>
              </div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default FeedbackList;
