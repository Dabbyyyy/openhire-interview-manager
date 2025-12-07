// src/components/AppShell.jsx
import { Link, NavLink, Outlet } from 'react-router-dom';

export default function AppShell() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <header className="border-bottom mb-3">
        <nav className="container navbar navbar-expand">
          <Link className="navbar-brand" to="/">OpenHire</Link>
          <ul className="navbar-nav gap-3">
            <li className="nav-item"><NavLink className="nav-link" to="/">Interviews</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/interviews/new">New interview</NavLink></li>
          </ul>
        </nav>
      </header>

      <main className="container mb-4">
        <Outlet />
      </main>

      <footer className="mt-auto py-3 border-top">
        <div className="container text-muted small">
          © {new Date().getFullYear()} OpenHire
        </div>
      </footer>
    </div>
  );
}
