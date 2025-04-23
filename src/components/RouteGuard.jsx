import { Navigate } from 'react-router-dom';

/**
 * A component that guards routes based on user role and other conditions
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - The component to render if conditions are met
 * @param {string} props.redirectTo - The path to redirect to if conditions are not met
 * @param {Function} props.condition - A function that returns true if access is allowed
 * @returns {React.ReactNode} - Either the children or a redirect
 */
const RouteGuard = ({ children, redirectTo, condition }) => {
  // If the condition is met, render the children
  if (condition()) {
    return children;
  }
  
  // Otherwise, redirect to the specified path
  return <Navigate to={redirectTo} replace />;
};

export default RouteGuard;
