// src/App.jsx
import React from 'react'
import './index.css'        // your Tailwind entry CSS
import Navbar from './components/Navbar'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="p-4">
        {/* TODO: replace with your dashboard content */}
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
          Welcome to Urban Flame Admin
        </h1>
      </main>
    </div>
  )
}
