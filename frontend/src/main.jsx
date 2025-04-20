import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Welcome from '../pages/welcome/welcome.jsx'
import Login from '../pages/loginregist/Login.jsx'
import Register from '../pages/loginregist/Register.jsx'
import MainHome from '../pages/mainpage/MainHome.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/main" element={<MainHome />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
