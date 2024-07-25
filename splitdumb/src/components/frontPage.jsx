// src/components/frontPage.jsx
import React from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase';  // Adjust path as necessary

export const FrontPage = () => {
    const [user] = useAuthState(auth);

    const signIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error('SignIn Error:', error);
        }
    };

    if (!user) {
        return (
            <div className="login-container">
                <h1>Welcome to SplitDumb!</h1>
                <h2>To continue, sign in with your Google Account</h2>
                <div className="Login">
                    <button onClick={signIn}>Sign In with Google</button>
                </div>
            </div>
            
        );
    }

    return null; // Return null if the user is authenticated
};
