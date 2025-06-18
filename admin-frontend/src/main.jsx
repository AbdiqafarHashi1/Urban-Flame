import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'      // ← this imports your Tailwind layers

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
