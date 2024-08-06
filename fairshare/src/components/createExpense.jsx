import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, collection, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const CreateExpense = () => {
    const { groupName } = useParams();
    const [title, setTitle] = useState('');
    const [cost, setCost] = useState('');
    const [notes, setNotes] = useState('');
    const [members, setMembers] = useState([]); // To store members' names
    const [userProfile, setUserProfile] = useState(null);
    const [profileExpanded, setProfileExpanded] = useState(false);
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

    // Fetch group details including members
    useEffect(() => {
        const fetchGroupDetails = async () => {
            if (!groupName) return;
            const groupRef = doc(db, "Groups", groupName);
            const docSnap = await getDoc(groupRef);

            if (docSnap.exists()) {
                const groupData = docSnap.data();
                setMembers(groupData.membersNames || []); // Assuming membersNames is the field
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
        
        fetchGroupDetails();
        fetchUserProfile();
        
    }, [groupName]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const expenseRef = doc(collection(db, "Groups", groupName, "Expenses"));
        const expenseData = {
            name: title,
            totalValue: Number(cost),
            notes,
            createdAt: serverTimestamp(),
            paidBy: members.length > 0 ? members[0] : "Unknown", // Default to first member
            splitEqual: true,
            consumedBy: members, // All members by default
            amountsConsumed: members.map(() => cost / members.length) // Split equally
        };

        if (!title || !cost) {
            alert("Please enter a valid name or cost");
            return;
        }
        
        try {
            await setDoc(expenseRef, expenseData);
            alert('Expense added successfully!');
            navigate(`/group/${groupName}`);
        } catch (error) {
            console.error("Error adding document: ", error);
            alert('Error adding expense!');
        }
    };

    if (!userProfile) {
        return <div className = "profile-container"> Loading User Profile...</div>;
    }

    return (
        <div className="expense-form-container">
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
            <form onSubmit={handleSubmit} className="expense-form">
                <h1>Add an expense</h1>
                <div className="form-group">
                    <label className="form-label">Title</label>
                    <input type="text" className="form-input" value={title} onChange={(e) => setTitle(e.target.value)} />
                </div>
                <div className="form-group">
                    <label className="form-label">Cost</label>
                    <input type="number" className="form-input" value={cost} onChange={(e) => setCost(e.target.value)} step="0.01" />
                </div>
                <div className="form-group">
                    <label className="form-label">Notes</label>
                    <textarea className="form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </div>
                <div className="form-group">
                    <label className="form-label">Paid by</label>
                    <select className="form-select" onChange={(e) => console.log(e.target.value)}>
                        {members.map((member, index) => (
                            <option key={index} value={member}>{member}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Split</label>
                    <select className="form-select">
                        <option value="equal">Equally</option>
                        {/* Additional split options can be added here */}
                    </select>
                </div>
                <button type="submit" className="form-submit-button">Done</button>
            </form>

        </div>
    );
};

export default CreateExpense;
