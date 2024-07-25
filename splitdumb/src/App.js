// src/App.js
import React from 'react';
import './App.css';
import { FrontPage } from './components/frontPage';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './firebase';
import ProfileSetup from './components/profileSetup';

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      {!user ? <FrontPage /> : <ProfileSetup />}
      {/* Other components */}
    </div>
  );
}

export default App;
