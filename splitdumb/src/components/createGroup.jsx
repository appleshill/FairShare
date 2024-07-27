import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { GeneratePassword } from './generatePassword';

const CreateGroup = () => {
    const [groupName, setGroupName] = useState('');
    const [file, setFile] = useState(null);
    const [groupPicUrl, setGroupPicUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/7/77/Dorian_2019-08-30_1618Z.jpg');
    const [error, setError] = useState('');
    const [password, setPassword] = useState(null);
    const [groupCreated, setGroupCreated] = useState(false);
    const navigate = useNavigate();

    const handleFileChange = event => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);

            const reader = new FileReader();
            reader.onload = (e) => {
                setGroupPicUrl(e.target.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async event => {
        event.preventDefault();

        // Check if group already exists
        const groupDocRef = doc(db, "Groups", groupName);
        const docSnap = await getDoc(groupDocRef);

        if (docSnap.exists()) {
            setError('Group name already taken, please choose another name.');
            return;
        }

        let imageUrl = groupPicUrl;
        if (file) {
            const fileRef = ref(storage, `groupImages/${groupName}`);
            await uploadBytes(fileRef, file);
            imageUrl = await getDownloadURL(fileRef);
        }

        // Create group document in Firestore
        setPassword(GeneratePassword());
        await setDoc(groupDocRef, {
            groupName,
            groupPicture: imageUrl,
            members: [auth.currentUser.uid], // Initially add creator to the group
            password,
        });
        const userDocRef = doc(db, "Users", auth.currentUser.uid);
        await updateDoc(userDocRef, {
            groups: arrayUnion(groupName) // Use arrayUnion to add the group name without duplicating existing entries
        });
        setGroupCreated(true);
        // navigate('/home'); // Navigate to home or group page after creation
    };
    
    const handleCopyInfo = () => {
        const copyText = `Group Name: ${groupName}\nPassword: ${password}`;
        navigator.clipboard.writeText(copyText);
        alert('Group info copied to clipboard!');
    };

    const handleRouteHome = () => {
        navigate ('/home');
    }

    if(groupCreated) {
        return (
            <div className="group-info-container">
                <img src={groupPicUrl} alt="Group" style={{ width: '200px', height: '200px', borderRadius: '50%' }} />
                <div className="group-details">
                    <p>Group Name: {groupName}</p>
                    <p>Password: {password}</p>
                    <button onClick={handleCopyInfo}>
                        <img src="/copy-icon.webp" alt="Copy" class="copy-icon"/>
                    </button>
                </div>
                <div className="home-button">
                    <button onClick={handleRouteHome}>Back to home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="form-container">
            <h1>Create a New Group</h1>
            {error && <p className="error">{error}</p>}
            <img src={groupPicUrl} alt="Group" className="profile-image" style={{ width: '200px', height: '200px', borderRadius: '50%' }} />
            <form onSubmit={handleSubmit}>
                <label className="custom-file-input">Choose Group Image
                    <input type="file" onChange={handleFileChange} />
                </label>
                <input className="form-input" type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Enter group name" />
                <button type="submit">Create Group</button>
            </form>
        </div>
    );
};

export default CreateGroup;
