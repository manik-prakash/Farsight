import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import App from './App'
import Home from './pages/Home'
import QuickStart from './pages/QuickStart'
import Demo from './pages/Demo'
import Protocol from './pages/Protocol'
import Security from './pages/Security'
import NotFound from './pages/NotFound'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<App />}>
          <Route index element={<Home />} />
          <Route path="quickstart" element={<QuickStart />} />
          <Route path="demo" element={<Demo />} />
          <Route path="protocol" element={<Protocol />} />
          <Route path="security" element={<Security />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
