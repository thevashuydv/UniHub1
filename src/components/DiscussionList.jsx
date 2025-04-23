import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DiscussionForm from './DiscussionForm';
import './DiscussionList.css';

const DiscussionList = ({ 
  discussionList, 
  loading, 
  isEventAdmin, 
  isRegistered,
  eventId,
  eventName,
  onReplySubmitted
}) => {
  const [replyingTo, setReplyingTo] = useState(null);
  const userEmail = localStorage.getItem('userEmail');

  // Format date for display
  const formatDate = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Group discussions by parent/child relationship
  const organizeDiscussions = () => {
    const questions = discussionList.filter(item => !item.parentQuestionId);
    const replies = discussionList.filter(item => item.parentQuestionId);
    
    // Create a map of question ID to its replies
    const repliesMap = {};
    replies.forEach(reply => {
      if (!repliesMap[reply.parentQuestionId]) {
        repliesMap[reply.parentQuestionId] = [];
      }
      repliesMap[reply.parentQuestionId].push(reply);
    });
    
    // Sort questions by creation date (newest first)
    questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    return { questions, repliesMap };
  };

  const { questions, repliesMap } = organizeDiscussions();

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
      <div className="discussion-loading">
        <div className="loading-spinner"></div>
        <p>Loading discussions...</p>
      </div>
    );
  }

  // Handle reply submission
  const handleReplySubmitted = () => {
    setReplyingTo(null);
    if (onReplySubmitted) {
      onReplySubmitted();
    }
  };

  // Check if admin has already replied to a question
  const hasAdminReplied = (questionId) => {
    return repliesMap[questionId] && repliesMap[questionId].length > 0;
  };

  return (
    <div className="discussion-list-container">
      {isRegistered && !isEventAdmin && (
        <DiscussionForm 
          eventId={eventId} 
          eventName={eventName} 
          onQuestionSubmitted={onReplySubmitted}
        />
      )}

      {questions.length === 0 ? (
        <div className="no-discussions-message">
          <p>No questions have been asked about this event yet.</p>
          {isRegistered && !isEventAdmin && (
            <p>Be the first to ask a question!</p>
          )}
        </div>
      ) : (
        <motion.div
          className="discussion-items"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {questions.map((question) => (
            <motion.div
              key={question.id}
              className="discussion-item"
              variants={itemVariants}
            >
              <div className="discussion-header">
                <div className="discussion-user">
                  <div className="user-avatar">
                    {question.userName ? question.userName.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="user-info">
                    <div className="user-name">{question.userName || 'Anonymous'}</div>
                    <div className="post-date">{formatDate(question.createdAt)}</div>
                  </div>
                </div>
              </div>

              <div className="discussion-content">
                <p>{question.question}</p>
              </div>

              {/* Show reply button for admins if they haven't replied yet */}
              {isEventAdmin && !hasAdminReplied(question.id) && (
                <div className="discussion-actions">
                  <motion.button
                    className="reply-button"
                    onClick={() => setReplyingTo(question.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Reply as Organizer
                  </motion.button>
                </div>
              )}

              {/* Show reply form if admin is replying to this question */}
              <AnimatePresence>
                {replyingTo === question.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="reply-form-container"
                  >
                    <DiscussionForm 
                      eventId={eventId} 
                      eventName={eventName} 
                      onQuestionSubmitted={handleReplySubmitted}
                      isReply={true}
                      parentQuestionId={question.id}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Show replies if any exist */}
              {repliesMap[question.id] && repliesMap[question.id].length > 0 && (
                <div className="discussion-replies">
                  {repliesMap[question.id].map(reply => (
                    <div key={reply.id} className="discussion-reply">
                      <div className="reply-header">
                        <div className="discussion-user">
                          <div className="user-avatar admin">
                            {reply.userName ? reply.userName.charAt(0).toUpperCase() : 'A'}
                          </div>
                          <div className="user-info">
                            <div className="user-name admin">{reply.userName} <span className="admin-badge">Organizer</span></div>
                            <div className="post-date">{formatDate(reply.createdAt)}</div>
                          </div>
                        </div>
                      </div>
                      <div className="reply-content">
                        <p>{reply.question}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {!isRegistered && !isEventAdmin && (
        <div className="registration-required-message">
          <p>You need to be registered for this event to participate in discussions.</p>
        </div>
      )}
    </div>
  );
};

export default DiscussionList;
