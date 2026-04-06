/* App.jsx */
import { useState } from "react";
import Dashboard from './components/Dashboard.jsx';
import './App.css';

function App() {
  // Set the default view to 'simulate' so the dashboard loads immediately
  const [view] = useState('simulate');

  return (
    <div className="app-container">
      {/* Navigation is hidden or simplified since there's only one view now */}
      <nav className="clinical-nav">
        <div className="nav-brand">xAI MED8</div>
      </nav>

      <main>
        {/* Only the Dashboard is rendered now */}
        <Dashboard />
      </main>
    </div>
  );
}

export default App;