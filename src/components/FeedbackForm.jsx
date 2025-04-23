import { useState, useEffect } from 'react';
import { collection, addDoc, doc, updateDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import './FeedbackForm.css';

const FeedbackForm = ({ eventId, eventName, onFeedbackSubmitted, existingFeedback = null }) => {
  const [rating, setRating] = useState(existingFeedback ? existingFeedback.rating : 0);
  const [comment, setComment] = useState(existingFeedback ? existingFeedback.comment : '');
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(!!existingFeedback);

  const userEmail = localStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName');

  // Update form when existingFeedback changes
  useEffect(() => {
    if (existingFeedback) {
      setRating(existingFeedback.rating);
      setComment(existingFeedback.comment || '');
      setIsEditing(true);
    }
  }, [existingFeedback]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const now = new Date().toISOString();

      if (isEditing && existingFeedback) {
        // Update existing feedback
        const feedbackRef = doc(db, 'event_feedback', existingFeedback.id);
        const updateData = {
          rating,
          comment: comment.trim(),
          updatedAt: now
        };

        await updateDoc(feedbackRef, updateData);
        console.log('Feedback updated successfully');
      } else {
        // Create new feedback document
        const feedbackData = {
          eventId: String(eventId), // Ensure eventId is stored as a string
          eventName,
          userEmail,
          userName,
          rating,
          comment: comment.trim(),
          createdAt: now,
          updatedAt: now
        };

        console.log('Submitting feedback with eventId:', String(eventId));

        await addDoc(collection(db, 'event_feedback'), feedbackData);
        console.log('New feedback submitted successfully');
      }

      // Reset form
      setRating(0);
      setComment('');
      setLoading(false);

      // Notify parent component
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError(`Failed to ${isEditing ? 'update' : 'submit'} feedback. Please try again.`);
      setLoading(false);
    }
  };

  return (
    <div className="feedback-form-container">
      <h3>{isEditing ? 'Edit Your Feedback' : 'Share Your Feedback'}</h3>
      <p className="feedback-subtitle">How would you rate your experience at {eventName}?</p>

      {error && <div className="feedback-error">{error}</div>}

      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="rating-container">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              type="button"
              className={`star-button ${star <= (hoverRating || rating) ? 'active' : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Rate ${star} stars`}
            >
              ★
            </motion.button>
          ))}

          <span className="rating-text">
            {rating === 0 ? 'Select a rating' :
             rating === 1 ? 'Poor' :
             rating === 2 ? 'Fair' :
             rating === 3 ? 'Good' :
             rating === 4 ? 'Very Good' : 'Excellent'}
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="comment">Comments (optional)</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about the event..."
            rows="4"
          />
        </div>

        <motion.button
          type="submit"
          className="submit-button"
          disabled={loading || rating === 0}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? 'Saving...' : isEditing ? 'Update Feedback' : 'Submit Feedback'}
        </motion.button>
      </form>
    </div>
  );
};

export default FeedbackForm;
