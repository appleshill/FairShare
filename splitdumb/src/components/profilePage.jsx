import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const ProfilePage = () => {
    const [userProfile, setUserProfile] = useState(null);

    useEffect(() => {
        const fetchUserProfile = async () => {
            const userDoc = doc(db, "Users", auth.currentUser.uid);
            const docSnap = await getDoc(userDoc);

            if (docSnap.exists()) {
                setUserProfile(docSnap.data());
            }
        };

        if (auth.currentUser) {
            fetchUserProfile();
        }
    }, []);

    if (!userProfile) {
        return <div className="profile-container">There was an error, no profile found.</div>;
    }

    return (
        <div className="profile-container">
            <img src={userProfile.profilePicture} alt="Profile" className="profile-image" />
            <h1 className="profile-name">{userProfile.name}</h1>
        </div>
    );
};

export default ProfilePage;
