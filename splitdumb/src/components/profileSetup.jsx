import React, { useEffect, useState } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import NewUserProfileForm from './NewUserProfileForm';
import ProfilePage from './profilePage';

const ProfileSetup = () => {
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const checkUserData = async () => {
            const userDoc = doc(db, "Users", auth.currentUser.uid);
            const docSnap = await getDoc(userDoc);

            if (docSnap.exists()) {
                setUserData(docSnap.data());
            } else {
                // No user data found, prompt for new user data
                setUserData({ newUser: true });
            }
        };

        if (auth.currentUser) {
            checkUserData();
        }
    }, []);

    if (!userData) {
        return <div>Loading...</div>;
    }

    return (
        userData.newUser ? <NewUserProfileForm /> : <ProfilePage />
    );
};

export default ProfileSetup;
