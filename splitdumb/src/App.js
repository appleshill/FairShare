// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { FrontPage } from './components/frontPage';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import ProfileExistsCheck from './components/profileExistsCheck';
import HomePage from './components/homePage';
import NewUserProfileForm from './components/NewUserProfileForm';
import CreateGroup from './components/createGroup';

function App() {
  const [user] = useAuthState(auth);

  return (
    <Router>
      <div className="App">
        <Routes>
            <Route path="/" element={!user ? <FrontPage /> : <Navigate to="/profile-exists-check" />} />
            <Route path="/profile-exists-check" element={user ? <ProfileExistsCheck /> : <Navigate to="/" />} />
            <Route path="/new-user-profile-form" element={user ? <NewUserProfileForm /> : <Navigate to="/" />} />
            <Route path="/home" element={user ? <HomePage /> : <Navigate to="/" />} />
            <Route path="*" element={<FrontPage />} /> 
            <Route path="/create-group" element={<CreateGroup />} />
          </Routes>
      </div>
    </Router>
  );
}

export default App;
