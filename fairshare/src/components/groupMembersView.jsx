import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const GroupMembersView = () => {
    const { groupName } = useParams();
    const [groupDetails, setGroupDetails] = useState(null);
    const [members, setMembers] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [profileExpanded, setProfileExpanded] = useState(false);
    const [groupCode, setGroupCode] = useState(null);
    const [membersInfo, setMembersInfo] = useState([]);
    const [groupInfo, setGroupInfo] = useState(null);
    const navigate = useNavigate();

    const editProfile = () => {
        navigate('/edit-profile');
    }

    const signOut = async() => {
        try {
            await auth.signOut(); 
            console.log('User signed out successfully');
            navigate('/frontPage');
        } catch (error) {
            console.error('Sign Out Error:', error);
        }
    };

    const toggleFAB = () => {
        setProfileExpanded(prev => !prev);
    }

    const goHome = () => {
        navigate('/home');
    }

    useEffect(() => {
        const fetchGroupDetails = async () => {
            if (!groupName) return;
            const groupRef = doc(db, "Groups", groupName);
            const groupSnap = await getDoc(groupRef);
            
            const groupData = groupSnap.data();
            setGroupInfo(groupData);

            if (groupSnap.exists()) {
                setGroupDetails(groupSnap.data());
                setMembers(groupSnap.data().membersNames);
                setGroupCode(groupSnap.data().groupCode);
                const membersData = await Promise.all(
                    groupData.members.map(async (memberId) => {
                        const userRef = doc(db, "Users", memberId);
                        const userSnap = await getDoc(userRef);
                        return userSnap.exists() ? { name: groupData.membersNames[groupData.members.indexOf(memberId)], ...userSnap.data() } : null;
                    })
                );
                setMembersInfo(membersData.filter(Boolean));
            } else {
                console.log('No such group!');
            }
        };

        const fetchUserProfile = async () => {
            if (!auth.currentUser) return;
            const userDoc = doc(db, "Users", auth.currentUser.uid);
            const docSnap = await getDoc(userDoc);

            

            if (docSnap.exists()) {
                setUserProfile(docSnap.data());
            }
        };

        fetchUserProfile();
        fetchGroupDetails();
    }, [groupName]);

    const handleCopyInfo = () => {
        const copyText = `Group Name: ${groupName}\nGroup Code: ${groupCode}`;
        navigator.clipboard.writeText(copyText);
        alert('Group info copied to clipboard!');
    };

    if (!userProfile) {
        return <div className = "profile-container"> Loading User Profile...</div>;
    }

    return (
        <div className="group-view-container">
             <div className="header-container">
                <div className="profile-fab-container" onClick={toggleFAB}>
                        <button aria-label="Home button" className ="home-icon-button" onClick={goHome}>
                            <img src="/home.svg" alt="Home-button" className="home-icon-button" />
                        </button>
                        <button aria-label="Profile Menu" className="profile-image-button" onClick={(e) => { e.stopPropagation(); setProfileExpanded(!profileExpanded); }}>
                            <img src={userProfile.profilePicture} alt="Profile" className="profile-image" />
                        </button>
                        {profileExpanded && (
                            <div className = 'profile-image-expanded'>
                                <h1 className="profile-name-in-menu">{userProfile.name}</h1>
                                <button onClick={() => editProfile()}>Edit Profile</button>
                                <button onClick={() => signOut()}>Sign Out</button>
                            </div>
                        )}
                </div>
            </div>
            <div className="group-info">
                <h1 className="group-name">{groupDetails?.groupName || 'Loading...'}</h1>
                <img src={groupDetails?.groupPicture || 'https://upload.wikimedia.org/wikipedia/commons/8/84/Question_Mark_Icon.png'} alt="Group" className="group-icon" />
            </div>
            <h2>Members</h2>
            {groupInfo && (
                <div className="members-list">
                    {membersInfo.map((member, index) => (
                            <div key={index}>
                                <img src={member.profilePicture} alt={member.name} />
                                <p>{member.name}</p>
                            </div>
                        ))}
                </div>
            )}
            <button onClick={() => handleCopyInfo()} className="copy-invite">Copy Invite</button>
            <button onClick={() => navigate(-1)} className="done-button">Done</button>
        </div>
    );
};

export default GroupMembersView;
