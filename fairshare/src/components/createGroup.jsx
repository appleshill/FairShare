import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { GenerateCode } from './generateCode';

const CreateGroup = () => {
    const [groupName, setGroupName] = useState('');
    const [file, setFile] = useState(null);
    const [groupPicUrl, setGroupPicUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/8/84/Question_Mark_Icon.png');
    const [error, setError] = useState('');
    const [groupCode, setGroupCode] = useState(null);
    const [groupCreated, setGroupCreated] = useState(false);
    const [userProfile, setUserProfile] = useState('');
    const navigate = useNavigate();

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

        }, []
    );

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
        const generatedCode = GenerateCode();
        await setDoc(groupDocRef, {
            groupName,
            groupPicture: imageUrl,
            members: [auth.currentUser.uid], 
            groupCode: generatedCode, 
            membersNames: [userProfile.name],
            simplifyDebts: true,
            currencyConversion: false,
        });
        const userDocRef = doc(db, "Users", auth.currentUser.uid);
        await updateDoc(userDocRef, {
            groups: arrayUnion(groupName) 
        });
        setGroupCode(generatedCode);
        setGroupCreated(true);
    };
    
    const handleCopyInfo = () => {
        const copyText = `Group Name: ${groupName}\nGroup Code: ${groupCode}`;
        navigator.clipboard.writeText(copyText);
        alert('Group info copied to clipboard!');
    };

    const handleRouteHome = () => {
        navigate ('/home');
    }

    if (!userProfile) {
        return <div className = "profile-container"> Loading User Profile...</div>;
    }

    if(groupCreated) {
        return (
            <div className="group-info-container">
                <img src={groupPicUrl} alt="Group" style={{ width: '200px', height: '200px', borderRadius: '50%' }} />
                <div className="group-details">
                    <p>Group Name: {groupName}</p>
                    <p>Group Code: {groupCode}</p>
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
