// src/components/frontPage.jsx
import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';  // Adjust path as necessary
import { useNavigate } from 'react-router-dom';

export const FrontPage = () => {
    const [user] = useAuthState(auth);
    const navigate = useNavigate();

    const signIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            navigate('/profile-exists-check');
        } catch (error) {
            console.error('SignIn Error:', error);
        }
    };

    if (!user) {
        return (
            <div className="login-container">
                <h1>Welcome to FairShare!</h1>
                <h2>To continue, sign in with your Google Account</h2>
                <div className="Login">
                    <button onClick={signIn}>Sign In with Google</button>
                </div>
            </div>
            
        );
    }

    return null; 
};
