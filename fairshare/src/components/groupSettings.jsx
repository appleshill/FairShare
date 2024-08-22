import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, setDoc, runTransaction, getFirestore, arrayRemove, deleteDoc } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import ConfirmationModal from './confirmationModal';

const GroupSettings = () => {
    const { groupName } = useParams();
    const [currentGroup, setCurrentGroup] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [profileExpanded, setProfileExpanded] = useState(false);
    const [user] = useAuthState(auth);
    const [simplifyDebts, setSimplifyDebts] = useState(false);
    const [arraysFilled, setArraysFilled] =  useState(false);
    const [currencyConversion, setCurrencyConversion] = useState(false); 
    const [editableGroupName, setEditableGroupName] = useState('');
    const [groupImage, setGroupImage] = useState(currentGroup.groupPicture || '');
    const [groupPicUrl, setGroupPicUrl]= useState('');
    const [file, setFile] = useState(null);
    const [isModalOpen, setModalOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchUserProfile = async () => {
            const userDoc = doc(db, "Users", auth.currentUser.uid);
            const docSnap = await getDoc(userDoc);

            if (docSnap.exists()) {
                setUserProfile(docSnap.data());
            }
        };

        const fetchCurrentGroup = async () => {
            const groupDocRef = doc(db, "Groups", groupName);
            const docSnap = await getDoc(groupDocRef);
            
            if (docSnap.exists()) {
                setCurrentGroup(docSnap.data());
                setGroupImage(docSnap.data().groupPicture);
                setEditableGroupName(docSnap.data().name || '');
                setSimplifyDebts(docSnap.data().simplifyDebts);
                setCurrencyConversion(docSnap.data().currencyConversion);
            } else {
                console.log('Group not found');
            }
        
        }

        if (auth.currentUser && !arraysFilled) {
            fetchUserProfile();
            fetchCurrentGroup();
            setArraysFilled(true);
        }

        }, [groupName, arraysFilled]
    );

    //profile expansion
    const signOut = async() => {
        try {
            await auth.signOut(); 
            navigate('/frontPage');
        } catch (error) {
            console.error('Sign Out Error:', error);
        }
      };

    const toggleFAB = () => {
        setProfileExpanded(prev => !prev);
    }

    const editProfile = () => {
        navigate('/edit-profile');
    }

    const goHome = () => {
        navigate('/home');
    }

    const handleImageChange = event => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
    
            const reader = new FileReader();
            reader.onload = (e) => {
                setGroupImage(e.target.result);
            };
            reader.readAsDataURL(selectedFile);
        }
    };
    
    const handleSubmitGroupChanges = async event => {
        event.preventDefault();
        
        let imageUrl = groupImage;
        const updates = {};
        if (file) {
            const fileRef = ref(storage, `groupImages/${groupName}`);
            await uploadBytes(fileRef, file);
            imageUrl = await getDownloadURL(fileRef);
        }
        if (imageUrl) {
            updates.groupPicture = imageUrl;
        }
        await updateDoc(doc(db, "Groups", groupName), {
            currencyConversion,
            simplifyDebts,
        });
        if (editableGroupName !== undefined && editableGroupName.trim() !== '' && editableGroupName.trim() !== groupName) {
            handleGroupNameChange(editableGroupName.trim(), imageUrl);
        } else {

            if (Object.keys(updates).length > 0) {
                console.log("Updates to be made:", updates);
                await updateDoc(doc(db, "Groups", groupName), updates);
                navigate('/group/' + groupName);
            } else {
                console.log('No changes to update');
            }
        }
    };

    const handleRemoveGroupPicture = async () => {
        const defaultPic = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg';
        const fileRef = ref(storage, `profilePictures/${auth.currentUser.uid}`);
        try {
            await deleteObject(fileRef);
        } catch (error) {
            console.error('Failed to delete the profile picture:', error);
        }
        setGroupPicUrl(defaultPic);
        await setDoc(doc(db, "Groups", groupName), { groupPicture: defaultPic }, { merge: true });
    };
    
    const handleGroupNameChange = async (newGroupName, imageUrl) => {
        const oldDocRef = doc(db, "Groups", groupName);
        const newDocRef = doc(db, "Groups", newGroupName);
    
        try {
            await runTransaction(db, async (transaction) => {
                const oldDoc = await transaction.get(oldDocRef);
                if (!oldDoc.exists()) {
                    throw new Error("Original group document does not exist!");
                }
                const oldData = oldDoc.data();
    
                const memberUpdates = oldData.members.map(async (memberId) => {
                    const userDocRef = doc(db, "Users", memberId);
                    const userDoc = await transaction.get(userDocRef);
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        const updatedGroups = userData.groups.map(g => g === groupName ? newGroupName : g);
                        transaction.update(userDocRef, { groups: updatedGroups });
                    }
                });
                await Promise.all(memberUpdates);

                transaction.set(newDocRef, { ...oldData, name: newGroupName, groupPicture: imageUrl });
    
                transaction.delete(oldDocRef);
            });
    
            console.log("Group name and member groups updated successfully");
            navigate('/group/' + newGroupName);
        } catch (error) {
            console.error("Failed to update group name and member groups:", error);
        }
    };

    const handleLeaveGroup = async (groupId, userId, userName) => {
        const db = getFirestore();
    
        const groupDocRef = doc(db, "Groups", groupId);
        const userDocRef = doc(db, "Users", userId);
    
        try {
            await updateDoc(groupDocRef, {
                members: arrayRemove(userId),
                membersNames: arrayRemove(userName)
            });
    
            await updateDoc(userDocRef, {
                groups: arrayRemove(groupId)
            });
            setModalOpen(false);
            goHome();
        } catch (error) {
            console.error("Failed to leave group:", error);
            setModalOpen(false);
        }
        
    };
    
    const handleDeleteGroup = async (groupId) => {
        const db = getFirestore();
        const groupDocRef = doc(db, "Groups", groupId);
    
        try {
            const groupDocSnap = await getDoc(groupDocRef);
            if (groupDocSnap.exists()) {
                const groupData = groupDocSnap.data();
                const members = groupData.members;
    
                const removalPromises = members.map(memberId => {
                    const userDocRef = doc(db, "Users", memberId);
                    return updateDoc(userDocRef, {
                        groups: arrayRemove(groupId)
                    });
                });

                await Promise.all(removalPromises);
    
                await deleteDoc(groupDocRef);
                console.log("Group deleted successfully");
                setModalOpen(false);
                goHome();
            } else {
                throw new Error("Group does not exist");
            }
        } catch (error) {
            console.error("Failed to delete group:", error);
            setModalOpen(false);
        }
    };
        


    if (!userProfile) {
        return <div className = "profile-container"> Loading User Profile...</div>;
    }

    if (!groupName) {
        return <div className = "profile-container"> Loading Group...</div>
    }

    return (
        <div className="profile-container">
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
            <div className="edit-profile-container">
                <form onSubmit={handleSubmitGroupChanges} className="edit-profile-form">
                    <div className="profile-picture-container">
                        <img src={groupImage || 'default-image-url.jpg'} alt="Group" className="edit-profile-image" />
                        <button onClick={handleRemoveGroupPicture} className="remove-picture-button">×</button>
                        <label className="file-input-label">
                            <input type="file" onChange={handleImageChange} />
                            Change Image
                        </label>
                    </div>
                    <div className="group-name-edit">
                        <input className="edit-input" type="text" value={editableGroupName} onChange={(e) => setEditableGroupName(e.target.value)} placeholder="Enter new group name" />
                    </div>
                    <div className="toggle-container">
                        <label className="toggle-label">Simplify Debts:</label>
                        <input type="checkbox" className="toggle-input" checked={simplifyDebts} onChange={() => setSimplifyDebts(!simplifyDebts)} />
                    </div>
                    <div className="toggle-container">
                        <label className="toggle-label">Currency Conversion:</label>
                        <input type="checkbox" className="toggle-input" checked={currencyConversion} onChange={() => setCurrencyConversion(!currencyConversion)} />
                    </div>
                    <button type="submit" className="submit-profile-button">Save Changes</button>
                </form>
            </div>
            <div className="settings-options">
                <button className="settings-button leave-group-button" onClick={() => setModalOpen(true)}>Leave Group</button>
                <ConfirmationModal
                    isOpen={isModalOpen}
                    message="Are you sure you want to leave the group?"
                    onClose={() => setModalOpen(false)}
                    onConfirm={() => handleLeaveGroup(groupName, auth.currentUser.uid, userProfile.name)}
                />
                <button className="settings-button delete-group-button" onClick={() => setModalOpen(true)}>Delete Group</button>
                <ConfirmationModal
                    isOpen={isModalOpen}
                    message="Are you sure you want to delete the group? This action cannot be undone."
                    onClose={() => setModalOpen(false)}
                    onConfirm={() => handleDeleteGroup(groupName)}
                />
            </div>
        </div>
    )
}

export default GroupSettings;