import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { GoogleAuthProvider } from 'firebase/auth';

const HomePage = () => {
    const [userProfile, setUserProfile] = useState(null);
    const [userGroups, setUserGroups] = useState([]);
    const [isExpanded, setIsExpanded] = useState(false);
    const [profileExpanded, setProfileExpanded] = useState(false);
    const [user] = useAuthState(auth);
    const navigate = useNavigate();

    const signOut = async() => {
        try {
            await auth.signOut(); // Sign out the user
            console.log('User signed out successfully');
            navigate('/frontPage');
        } catch (error) {
            console.error('Sign Out Error:', error);
        }
      };
    
    const toggleFAB = () => {
        setProfileExpanded(prev => !prev);
    }

    useEffect(() => {
        const fetchUserProfile = async () => {
            const userDoc = doc(db, "Users", auth.currentUser.uid);
            const docSnap = await getDoc(userDoc);

            if (docSnap.exists()) {
                setUserProfile(docSnap.data());
                setUserGroups(docSnap.data().groups || []);
            }
            console.log(userGroups);
        };

        if (auth.currentUser) {
            fetchUserProfile();
        }

        }, []
    );

    if (!userProfile) {
        return <div className = "profile-container"> Loading User Profile...</div>;
    }
    return (
        <div className="profile-container">
            <div className="header-container">
                <h1 className="profile-name">{userProfile.name}</h1>
                <div className="profile-fab-container" onClick={toggleFAB}>
                    <button aria-label="Profile Menu" className="profile-image-button" onClick={(e) => { e.stopPropagation(); setProfileExpanded(!profileExpanded); }}>
                        <img src={userProfile.profilePicture} alt="Profile" className="profile-image" />
                    </button>
                    {profileExpanded && (
                        <div className = 'profile-image-expanded'>
                            <button onClick={() => console.log('Profile edit functionality coming soon')}>Edit Profile</button>
                            <button onClick={() => signOut()}>Sign Out</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="groups-section">
                <h2>Groups</h2>
                    {userGroups.length > 0 ? (
                        <ul>
                            {userGroups.map((group, index) => (
                                <li key={index}>{group}</li> // Display each group name
                            ))}
                        </ul>
                    ) : (
                        <p>No groups joined yet.</p>
                    )}
            </div>
            <div className="fab-container" onClick={() => setIsExpanded(!isExpanded)}>
                <button className="fab-button">+</button>
                {isExpanded && (
                    <div className="fab-options">
                        <button onClick={() => navigate('/create-group')}>Create Group</button>
                        <button onClick={() => console.log('Join Group functionality coming soon')}>Join Group</button> {/* do this */}
                    </div>
                )}
            </div>
        </div>
    );
};


export default HomePage;
