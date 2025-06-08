import React from "react";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Welcome from './pages/welcome/welcome.jsx'
import Login from './pages/loginregist/Login.jsx'
import Register from './pages/loginregist/Register.jsx'
import MainHome from './pages/mainpage/MainHome.jsx'
import MainInv from './pages/mainpage/MainInv.jsx'
import MainAchievement from './pages/mainpage/MainAchievement.jsx'
import HomeDaily from './pages/mainpage/HomeDaily.jsx'
import MiscQuest from './pages/miscpage/MiscQuest.jsx'
import MiscProfile from './pages/miscpage/MiscProfile.jsx' 
import MiscPets from "./pages/miscpage/MiscPets.jsx"
import Adventure from './pages/mainpage/advpage/Adventure.jsx';
import MiscGacha from './pages/miscpage/MiscGacha.jsx'
import Friends from './components/Topbar/Friends.jsx'
import Support from './components/Topbar/support.jsx'
import MiscShop from './pages/miscpage/MiscShop.jsx'

import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/main" element={<MainHome />} />
          <Route path="/inventory" element={<MainInv />} />
          <Route path="/achievement" element={<MainAchievement />} />
          <Route path="/quest" element={<MiscQuest />} />
          <Route path="/profile" element={<MiscProfile />} />
          <Route path="/pets" element={<MiscPets />} />
          <Route path="/shop" element={<MiscShop />} />
          <Route path="/adventure" element={<Adventure />} />
          <Route path="/daily" element={<HomeDaily />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/gacha" element={<MiscGacha/>}/>
          <Route path="/support" element={<Support />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
