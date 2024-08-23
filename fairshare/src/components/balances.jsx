// An LP solution would have been better. I just couldn't get the libraries to work in time
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, collection, getDoc, query, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import SettleBigDebt from './settleBigDebt';

const Balances = () => {
    const { groupName } = useParams();
    const [members, setMembers] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [userProfile, setUserProfile] = useState(null);
    const [profileExpanded, setProfileExpanded] = useState(false);
    const [arraysFilled, setArraysFilled] = useState(false);
    const navigate = useNavigate();

    const goHome = () => {
        navigate('/home');
    }

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


    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!auth.currentUser) return;
            const userDoc = doc(db, "Users", auth.currentUser.uid);
            const docSnap = await getDoc(userDoc);

            if (docSnap.exists()) {
                setUserProfile(docSnap.data());
            }
        };

        const fetchExpensesAndDebts = async () => {
            const expenseQuery = query(collection(db, "Groups", groupName, "Expenses"));
            const querySnapshot = await getDocs(expenseQuery);
            const memberMap = new Map();
            const allTransactions = [];

            // Compile debts into a list
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (data.Debts && Array.isArray(data.Debts)) {
                    data.Debts.forEach(debt => {
                        allTransactions.push({
                            from: debt.from,
                            to: debt.to,
                            amount: parseFloat(debt.amount)
                        });
                        if (!memberMap.has(debt.from)) {
                            memberMap.set(debt.from, memberMap.size);
                        }
                        if (!memberMap.has(debt.to)) {
                            memberMap.set(debt.to, memberMap.size);
                        }
                    });
                }
            });

            const size = memberMap.size;
            const debtsMatrix = Array.from({ length: size }, () => new Array(size).fill(0));


            allTransactions.forEach(trans => {
                const fromIndex = memberMap.get(trans.from);
                const toIndex = memberMap.get(trans.to);
                debtsMatrix[fromIndex][toIndex] += trans.amount;
            });

 
            const simplifiedTransactions = SettleBigDebt(debtsMatrix, Array.from(memberMap.keys()));

            console.log("Simplified Transactions:", simplifiedTransactions);
            setTransactions(simplifiedTransactions);
            setMembers(Array.from(memberMap.keys()));
        };
        if(!arraysFilled) {
            fetchExpensesAndDebts();
            fetchUserProfile();
        }
    }, [groupName, arraysFilled]);

    if (!userProfile) {
        return <div className = "profile-container"> Loading User Profile...</div>;
    };

    return (
        <div className="group-view-container">
            <div className="header-container">
                <div className="profile-fab-container" onClick={toggleFAB}>
                    <button aria-label="Home button" className="home-icon-button" onClick={goHome}>
                        <img src="/home.svg" alt="Home-button" className="home-icon-button" />
                    </button>
                    <button aria-label="Profile Menu" className="profile-image-button" onClick={(e) => { e.stopPropagation(); setProfileExpanded(!profileExpanded); }}>
                        <img src={userProfile.profilePicture} alt="Profile" className="profile-image" />
                    </button>
                    {profileExpanded && (
                        <div className='profile-image-expanded'>
                            <h1 className="profile-name-in-menu">{userProfile.name}</h1>
                            <button onClick={() => editProfile()}>Edit Profile</button>
                            <button onClick={() => signOut()}>Sign Out</button>
                        </div>
                    )}
                </div>
            </div>
            <div className="totals-container">
                <h1 className="totals-header">Final Debt Balances for {groupName}</h1>
                <ul className="member-details-list">
                    {transactions.map((trans, index) => (
                        <li className="member-detail" key={index}>{trans.from} owes {trans.to} ${trans.amount.toFixed(2)}</li>
                    ))}
                </ul>
            </div>
            <button onClick={() => navigate(-1)}>Done</button>
        </div>
    );
};

export default Balances;