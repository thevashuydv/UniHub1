import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../firebase';
import './DiscussionForm.css';

const DiscussionForm = ({ eventId, eventName, onQuestionSubmitted, isReply = false, parentQuestionId = null }) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const userEmail = localStorage.getItem('userEmail');
  const userName = localStorage.getItem('userName');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!question.trim()) {
      setError('Please enter a question or comment');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const now = new Date().toISOString();

      // Create discussion document
      const discussionData = {
        eventId: String(eventId),
        eventName,
        userEmail,
        userName,
        question: question.trim(),
        createdAt: now,
        isAdminReply: isReply,
        parentQuestionId: isReply ? parentQuestionId : null
      };

      await addDoc(collection(db, 'event_discussions'), discussionData);
      console.log('Discussion question submitted successfully');

      // Reset form
      setQuestion('');
      setLoading(false);

      // Notify parent component
      if (onQuestionSubmitted) {
        onQuestionSubmitted();
      }
    } catch (err) {
      console.error('Error submitting discussion question:', err);
      setError('Failed to submit your question. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="discussion-form-container">
      <h3>{isReply ? 'Reply to Question' : 'Ask a Question'}</h3>
      {!isReply && <p className="discussion-subtitle">Have a question about {eventName}? Ask here and the event organizers will respond.</p>}

      {error && <div className="discussion-error">{error}</div>}

      <form onSubmit={handleSubmit} className="discussion-form">
        <div className="form-group">
          <textarea
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={isReply ? "Type your reply here..." : "Type your question here..."}
            rows="3"
            required
          />
        </div>

        <motion.button
          type="submit"
          className="submit-button"
          disabled={loading || !question.trim()}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {loading ? 'Submitting...' : isReply ? 'Post Reply' : 'Post Question'}
        </motion.button>
      </form>
    </div>
  );
};

export default DiscussionForm;
