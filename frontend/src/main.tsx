import '@/styles/global.css'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import App from '@/App'
import { AuthProvider } from '@/components/context/AuthContext'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <AuthProvider><App /></AuthProvider>
  </BrowserRouter>,
)
