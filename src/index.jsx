import React from 'react';
import ReactDOM from 'react-dom/client';
import ReactGA from 'react-ga';
import App from './App';

import 'bootstrap/dist/css/bootstrap.css';
import 'spectre.css/dist/spectre.min.css';
import './index.css';

ReactGA.initialize('UA-74405434-8');
ReactGA.pageview(window.location.pathname + window.location.search);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
