import React, { useState } from 'react';
import { auth, db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';

const NewUserProfileForm = () => {
    const [name, setName] = useState('');
    const [file, setFile] = useState(null);
    const [profilePicUrl, setProfilePicUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg');

    const handleFileChange = event => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);

            const reader = new FileReader();
            reader.onload = (e) => {
                setProfilePicUrl(e.target.result); // Display the selected image as profile pic
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

        const userDoc = doc(db, "Users", auth.currentUser.uid);
        await setDoc(userDoc, { name, profilePicture: imageUrl });
    };

    return (
        <div className="form-container">
            <h1>Welcome</h1>
            <p>To start, upload a profile picture and tell us your name</p>
            <img src={profilePicUrl} alt="Profile" className="profile-image" style={{ width: '200px', height: '200px', borderRadius: '50%' }} />
            <form onSubmit={handleSubmit}>
                <label className="custom-file-input">Choose File
                    <input type="file" onChange={handleFileChange} />
                </label>
                <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your name" />
                <button type="submit">Save Profile</button>
            </form>
        </div>
    );
};

export default NewUserProfileForm;
