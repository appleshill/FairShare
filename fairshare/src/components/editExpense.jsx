import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const EditExpense = () => {
    const { groupName, expenseId } = useParams();
    const [title, setTitle] = useState('');
    const [cost, setCost] = useState('');
    const [notes, setNotes] = useState('');
    const [members, setMembers] = useState([]);
    const [paidBy, setPaidBy] = useState('');
    const [splitEqual, setSplitEqual] = useState(true);
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

    useEffect(() => {
        const fetchExpenseDetails = async () => {
            const expenseRef = doc(db, "Groups", groupName, "Expenses", expenseId);
            const expenseSnap = await getDoc(expenseRef);

            if (expenseSnap.exists()) {
                const expenseData = expenseSnap.data();
                setTitle(expenseData.name);
                setCost(expenseData.totalValue);
                setNotes(expenseData.notes);
                setPaidBy(expenseData.paidBy);
                setSplitEqual(expenseData.splitEqual);
            } else {
                console.log('No such expense!');
            }
        };

        const fetchGroupDetails = async () => {
            const groupRef = doc(db, "Groups", groupName);
            const groupSnap = await getDoc(groupRef);

            if (groupSnap.exists()) {
                setMembers(groupSnap.data().membersNames || []);
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

        fetchExpenseDetails();
        fetchGroupDetails();
        fetchUserProfile();
    }, [groupName, expenseId]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const expenseRef = doc(db, "Groups", groupName, "Expenses", expenseId);
        const updatedExpenseData = {
            name: title,
            totalValue: Number(cost),
            notes,
            paidBy,
            splitEqual,
        };

        try {
            await updateDoc(expenseRef, updatedExpenseData);
            alert('Expense updated successfully!');
            navigate(`/group/${groupName}`);
        } catch (error) {
            console.error("Error updating document: ", error);
            alert('Error updating expense!');
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
                <h1>Edit Expense</h1>
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
                    <select className="form-select" value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
                        {members.map((member) => (
                            <option key={member} value={member}>{member}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label className="form-label">Split</label>
                    <select className="form-select" alue={splitEqual ? 'equal' : 'unequal'} onChange={(e) => setSplitEqual(e.target.value === 'equal')}>
                        <option value="equal">Equally</option>
                        <option value="unequal">Unequally</option>
                    </select>
                </div>
                <button type="submit" className="form-submit-button">Update</button>
            </form>
        </div>
    );
};

export default EditExpense;
