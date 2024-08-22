import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, collection, getDoc, query, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ViewTotals = () => {
    const { groupName } = useParams(); 
    const [arraysFilled, setArraysFilled] = useState(false);
    const [userProfile, setUserProfile] = useState(null);
    const [profileExpanded, setProfileExpanded] = useState(false);
    const [groupTotals, setGroupTotals] = useState({
        totalPaid: 0,
        totalConsumed: 0,
        memberTotals: {}
    });
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
        const fetchExpenses = async () => {
            const q = query(collection(db, "Groups", groupName, "Expenses"));
            const querySnapshot = await getDocs(q);
            const totals = {
                totalPaid: 0,
                totalConsumed: 0,
                memberTotals: {}
            };
    
            querySnapshot.forEach((doc) => {
                const expense = doc.data();
                const { totalValue, paymentShares, amountsConsumed, consumedBy, paidBy } = expense;
    
                // Calculate total consumed
                totals.totalConsumed += Number(totalValue);
    
                // Handle payments
                if (paidBy === "Multiple") {
                    paymentShares.forEach((amount, index) => {
                        const member = consumedBy[index];
                        if (member) { // Ensure member exists
                            if (!totals.memberTotals[member]) {
                                totals.memberTotals[member] = { paid: 0, consumed: 0 };
                            }
                            totals.memberTotals[member].paid += Number(amount);
                            totals.totalPaid += Number(amount);
                        }
                    });
                } else {
                    if (!totals.memberTotals[paidBy]) {
                        totals.memberTotals[paidBy] = { paid: 0, consumed: 0 };
                    }
                    totals.memberTotals[paidBy].paid += Number(totalValue);
                    totals.totalPaid += Number(totalValue);
                }    

                // Handle consumption
                amountsConsumed.forEach((amount, index) => {
                    const member = consumedBy[index];
                    totals.memberTotals[member] = totals.memberTotals[member] || { paid: 0, consumed: 0 };
                    totals.memberTotals[member].consumed += Number(amount);
                });
            });

            setGroupTotals(totals);
        };

        const fetchUserProfile = async () => {
            if (!auth.currentUser) return;
            const userDoc = doc(db, "Users", auth.currentUser.uid);
            const docSnap = await getDoc(userDoc);

            if (docSnap.exists()) {
                setUserProfile(docSnap.data());
            }
        };

        if (!arraysFilled)  {
            fetchUserProfile();
            fetchExpenses();
            
            setArraysFilled(true);
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
                <h1 className="totals-header">Group Totals for {groupName}</h1>
                <h2 className="total-consumed">Total Consumed: ${groupTotals.totalConsumed.toFixed(2)}</h2>
                <h3 className="member-details-header">Member Details:</h3>
                <ul className="member-details-list"> {/* Consider adding member profile images */}
                    {Object.entries(groupTotals.memberTotals).map(([member, totals]) => (
                        <li key={member} className="member-detail">
                            {member}: Paid ${totals.paid.toFixed(2)}, Consumed ${totals.consumed.toFixed(2)}
                        </li>
                    ))}
                </ul>
            </div>
            <button onClick={() => navigate(-1)}>Done</button>
        </div>
    );

};

export default ViewTotals;

