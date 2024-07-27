import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

const ProfileExistsCheck = () => {
    const [userData, setUserData] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const checkUserData = async () => {
            const userDoc = doc(db, "Users", auth.currentUser.uid);
            const docSnap = await getDoc(userDoc);

            if (docSnap.exists()) {
                setUserData(docSnap.data()); // Data exists, navigate to home page
                navigate('/home');
            } else {
                
                setUserData({ newUser: true });
                navigate('/new-user-profile-form'); // Navigate to the profile setup form
            }
        };

        if (auth.currentUser) {
            checkUserData();
        }
    }, [navigate]);

    if (!userData) {
        return <div>Loading...</div>; 
    }

    return null;
};

export default ProfileExistsCheck;

