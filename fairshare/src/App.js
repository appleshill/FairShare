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
import EditProfile from './components/editProfile';
import JoinGroup from './components/joinGroup';
import MainGroupPage from './components/mainGroupPage';
import CreateExpense from './components/createExpense';
import GroupMembersView from './components/groupMembersView';
import ViewExpense from './components/viewExpense';

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
            <Route path="/frontPage" element={<FrontPage />} />
            <Route path="/create-group" element={<CreateGroup />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/join-group" element={<JoinGroup />} />
            <Route path="/group/:groupName" element={<MainGroupPage />} />
            <Route path="/group/:groupName/create-expense" element={<CreateExpense />} />
            <Route path="/group/:groupName/members" element={<GroupMembersView />} />
            <Route path="/group/:groupName/expenses/:expenseId" element={<ViewExpense />} />
          </Routes>
      </div>
    </Router>
  );
}

export default App;
