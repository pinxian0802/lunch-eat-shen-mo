import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import HomePage from './HomePage.jsx'
import LuweiOrderingApp from './LuweiOrderingApp.jsx'
import LunchPicker from './LunchPicker.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/luwei" element={<LuweiOrderingApp />} />
        <Route path="/lunch-picker" element={<LunchPicker />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
