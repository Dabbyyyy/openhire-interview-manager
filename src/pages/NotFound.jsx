// src/pages/NotFound.jsx
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container text-center py-5">
      <h1 className="display-4 mb-3">404</h1>
      <p className="lead">Oops! The page you’re looking for doesn’t exist.</p>
      <Link to="/" className="btn btn-primary mt-3">
        Back to Home
      </Link>
    </div>
  );
}
