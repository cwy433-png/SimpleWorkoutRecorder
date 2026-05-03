import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { WorkoutSessionProvider } from './modules/tracker/SessionContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <WorkoutSessionProvider>
      <App />
    </WorkoutSessionProvider>
  </StrictMode>,
)
