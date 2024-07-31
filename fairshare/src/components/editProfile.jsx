import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const EditProfile = () => {
    const [name, setName] = useState('');
    const [file, setFile] = useState(null);
    const [profilePicUrl, setProfilePicUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    
    
    useEffect(() => {
        const fetchUserProfile = async () => {
            const userDoc = doc(db, "Users", auth.currentUser.uid);
            const docSnap = await getDoc(userDoc);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                setName(userData.name);
                setProfilePicUrl(userData.profilePicture || 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg');
            }
            setLoading(false);
        };

        if (auth.currentUser) {
            fetchUserProfile();
        }
        }, []
    );
    
    const handleFileChange = event => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);

            const reader = new FileReader();
            reader.onload = (e) => {
                setProfilePicUrl(e.target.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async event => {
        event.preventDefault();

        let imageUrl = profilePicUrl;
        if (file) {
            const fileRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
            await uploadBytes(fileRef, file);
            imageUrl = await getDownloadURL(fileRef);
        }

        await setDoc(doc(db, "Users", auth.currentUser.uid), { name, profilePicture: imageUrl }, { merge: true });
        navigate('/home');
    };

    const handleRemoveProfilePicture = async () => {
        const defaultPic = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg';
        const fileRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
        try {
            await deleteObject(fileRef);
        } catch (error) {
            console.error('Failed to delete the profile picture:', error);
        }
        setProfilePicUrl(defaultPic);
        await setDoc(doc(db, "Users", auth.currentUser.uid), { profilePicture: defaultPic }, { merge: true });
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="edit-profile-container">
            <h1>Edit Your Profile</h1>
            <div className="profile-picture-container">
                <img src={profilePicUrl} alt="Profile" className="edit-profile-image" />
                <button onClick={handleRemoveProfilePicture} className="remove-picture-button">×</button>
            </div>
            <form onSubmit={handleSubmit} className="edit-profile-form">
                <label className="file-input-label">
                    <input type="file" onChange={handleFileChange} />
                    Choose File
                </label>
                <input className="edit-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" />
                <button type="submit" className="submit-profile-button">Update Profile</button>
            </form>
        </div>
    );    
};

export default EditProfile;

