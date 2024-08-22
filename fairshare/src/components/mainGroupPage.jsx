import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';

const MainGroupPage = () => {
    const { groupName } = useParams();
    const [currentGroup, setCurrentGroup] = useState('');
    const [Expenses, setExpenses] = useState(null);
    // const [groupPicUrl, setGroupPicUrl] = useState('');
    const [userProfile, setUserProfile] = useState(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [profileExpanded, setProfileExpanded] = useState(false);
    const [user] = useAuthState(auth);
    const navigate = useNavigate();


    const fetchCurrentGroup = async () => {
        const groupDocRef = doc(db, "Groups", groupName);
        const docSnap = await getDoc(groupDocRef);
        
        if (docSnap.exists()) {
            setCurrentGroup(docSnap.data());
            // Fetch expenses from the subcollection
            const expensesCollectionRef = collection(db, "Groups", groupName, "Expenses");
            const expenseSnapshots = await getDocs(expensesCollectionRef);
            const expensesData = expenseSnapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExpenses(expensesData);
        } else {
            console.log('Group not found');
        }
    
    }

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
            fetchCurrentGroup();
        }

        }, []
    );

    //profile expansion
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

    const editProfile = () => {
        navigate('/edit-profile');
    }

    const goHome = () => {
        navigate('/home');
    }

    //buttons

    const balances = () => {
        //change this when available
        console.log('Balance button pressed');
    }

    const totals = () => {
        navigate(`/group/${groupName}/view-totals`);
    }

    const settings = () => {
        navigate(`/group/${groupName}/group-settings`);
    }

    //expenses

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
            <div className="group-info"> 
                <h1 className="group-name">{groupName}</h1>
                <img src={currentGroup.groupPicture} alt="Group Icon" className="group-icon" />
            </div>
            <div className="button-container">
                <button onClick={balances} className="group-button">Balances</button>
                <button onClick={totals} className="group-button">Totals</button>
                <button onClick={() => navigate(`/group/${groupName}/members`)} className="group-button">Members</button>
                <button onClick={settings} className="group-button">Settings</button>
            </div>
            <div className="expenses-section">
                <h2>Expenses</h2>
                {Expenses && Expenses.length > 0 ? (
                    <ul>
                        {Expenses.map((expense, index) => (
                            <li key={index} onClick={() => navigate(`/group/${groupName}/expenses/${expense.id}`)}>
                                {expense.name} - Total Value: {expense.totalValue}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No expenses added yet.</p>
                )}
            </div>
            <div className="fab-container" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded && (
                    <div className="fab-options">
                        <button onClick={() => navigate(`/group/${groupName}/create-expense`)}>Create Expense</button>
                    </div>
                )}
                <button className="fab-button">+</button>
            </div>
        </div>
    )
}

export default MainGroupPage;