import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './index.css'
createRoot(document.getElementById('root')).render(<React.StrictMode><App initialTab="受験記"/></React.StrictMode>)
