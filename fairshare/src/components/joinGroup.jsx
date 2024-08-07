import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const JoinGroup = () => {
    const [groupName, setGroupName] = useState('');
    const [error, setError] = useState('');
    const [groupCode, setGroupCode] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const navigate = useNavigate();
    const [groupPicUrl, setGroupPicUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/8/84/Question_Mark_Icon.png');
    const defaultGroupImageUrl = 'https://upload.wikimedia.org/wikipedia/commons/8/84/Question_Mark_Icon.png';

    useEffect(() => {
        const fetchUserProfile = async () => {
            const userDoc = doc(db, "Users", auth.currentUser.uid);
            const userDocSnap = await getDoc(userDoc);

            if (userDocSnap.exists()) {
                setUserProfile(userDocSnap.data());
            }
        };

        if (auth.currentUser) {
            fetchUserProfile();
        }

        }, []
    );

    const handleSubmit = async event => {
        event.preventDefault();
    
        const groupDocRef = doc(db, "Groups", groupName);
        const docSnap = await getDoc(groupDocRef);
    
        if (!docSnap.exists()) {
            setError('Group does not exist, please check your group name.');

            return;
        }
    
        const groupData = docSnap.data();
        const imageUrl = groupData.groupPicture || defaultGroupImageUrl;
        setGroupPicUrl(imageUrl);
    
        if (groupCode !== groupData.groupCode) {
            setError('Incorrect Group Code entered, please try again.');
            return;
        }
    
        await updateDoc(groupDocRef, {
            members: arrayUnion(auth.currentUser.uid),
            membersNames: arrayUnion(userProfile.name),
        });
        const userDocRef = doc(db, "Users", auth.currentUser.uid);
        await updateDoc(userDocRef, {
            groups: arrayUnion(groupName)
        });
    
        setError('Successfully joined ' + groupName + '!');
        setTimeout(() => navigate('/home'), 600);
    };    

    return (
        <div className="form-container">
            <h1>Join an Existing Group</h1>
            {error && <p className="error">{error}</p>}
            <img src={groupPicUrl} alt="Group" className="group-image" style={{ width: '200px', height: '200px', borderRadius: '50%' }} />
            <form onSubmit={handleSubmit}>
                <input className="form-input" type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Enter group name" />
                <input className="form-input" type="groupCode" value={groupCode} onChange={e => setGroupCode(e.target.value)} placeholder="Enter group code" />
                <button type="submit">Join Group</button>
            </form>
        </div>
    );    
};

export default JoinGroup;
