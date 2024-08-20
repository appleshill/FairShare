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
    const [userProfile, setUserProfile] = useState(null);
    const [paidByMultiple, setPaidByMultiple] = useState(false);
    const [paymentShares, setPaymentShares] = useState([]);
    const [splitMethod, setSplitMethod] = useState('equally');
    const [memberSplits, setMemberSplits] = useState([]);
    const [memberPercentages, setMemberPercentages] = useState([]);
    const [paidBy, setPaidBy] = useState('');
    const [profileExpanded, setProfileExpanded] = useState(false);
    const [arraysFilled, setArraysFilled] = useState(false);
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
                setPaidByMultiple(expenseData.paidBy === "Multiple");
                setPaidBy(expenseData.paidBy); 
                setPaymentShares(expenseData.paymentShares || []);
                setMemberSplits(expenseData.amountsConsumed);
                setSplitMethod(expenseData.splitMethod);
                if (expenseData.splitMethod === 'percentage') {
                    setMemberPercentages(expenseData.memberPercentages);
                }
            } else {
                console.log('No such expense!');
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


        const fetchGroupDetails = async () => {
            const groupRef = doc(db, "Groups", groupName);
            const groupSnap = await getDoc(groupRef);

            if (groupSnap.exists()) {
                setMembers(groupSnap.data().membersNames || []);
                if (!paymentShares.length) {
                    setPaymentShares(new Array(groupSnap.data().membersNames.length).fill(0));
                }
                if (!memberSplits.length) {
                    setMemberSplits(new Array(groupSnap.data().membersNames.length).fill(0));
                }
                if (!memberPercentages.length) {
                    setMemberPercentages(new Array(groupSnap.data().membersNames.length).fill(0));
                }
            } else {
                console.log('No such group!');
            }
        };

        if (!arraysFilled) {
            fetchGroupDetails();
            fetchUserProfile();
            setArraysFilled(true);
            fetchExpenseDetails();
        }
    }, [groupName, expenseId, memberPercentages.length, memberSplits.length, paymentShares.length, arraysFilled]);

    const handlePaymentChange = (index, value) => {
        let newShares = [...paymentShares];
        newShares[index] = Number(value);
        setPaymentShares(newShares);
    };
    const handleSplitChange = (index, value) => {
        const numericValue = parseFloat(value);
        if (splitMethod === 'percentage') {
            let newPercentages = [...memberPercentages];
            newPercentages[index] = numericValue;
            setMemberPercentages(newPercentages);
        } else {
            let newSplits = [...memberSplits];
            newSplits[index] = numericValue;
            setMemberSplits(newSplits);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        let currentMemberSplits = memberSplits;

        if (paidByMultiple) {
            const totalPaid = paymentShares.reduce((acc, current) => acc + current, 0);
            if (Math.abs(totalPaid - Number(cost)) > 0.01) {
                alert(`The total payments of $${totalPaid.toFixed(2)} do not match the total cost of $${cost}. Please adjust the amounts.`);
                return;
            }
        }
        if (splitMethod === 'absolute') {
            const totalPaid = memberSplits.reduce((acc, current) => acc + current, 0);
            if (Math.abs(totalPaid - parseFloat(cost)) > 0.01) {
                alert(`The total payments of $${totalPaid.toFixed(2)} do not match the total cost of $${cost}. Please adjust the amounts.`);
                return;
            }
        }
        if (splitMethod === 'percentage') {
            currentMemberSplits = memberPercentages.map(percentage => parseFloat((percentage / 100 * cost).toFixed(2)));
        }

        const updatedExpenseData = {
            name: title,
            totalValue: Number(cost),
            notes,
            paidBy: paidByMultiple ? "Multiple" : members[0],
            paymentShares: paidByMultiple ? paymentShares : [],
            memberPercentages: splitMethod === 'percentage' ? memberPercentages : [],
            splitMethod,
            amountsConsumed: currentMemberSplits,
            consumedBy: members,
        };

        try {
            await updateDoc(doc(db, "Groups", groupName, "Expenses", expenseId), updatedExpenseData);
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
                    <select className="form-select" value={paidByMultiple ? "Multiple People" : paidBy} onChange={(e) => setPaidByMultiple(e.target.value === "Multiple People")}>
                        {members.map((member, index) => (
                            <option key={index} value={member}>{member}</option>
                        ))}
                        <option value="Multiple People">Multiple People</option>
                    </select>
                    {paidByMultiple && members.map((member, index) => (
                        <div key={index}>
                            <label className="share-cost-label">{member} paid:</label>
                            <input className="share-cost-values" type="number" value={paymentShares[index]} onChange={(e) => handlePaymentChange(index, e.target.value)} />
                        </div>
                    ))}
                </div>
                <div className="form-group">
                    <label className="form-label">Split</label>
                    <select className="form-select" value={splitMethod} onChange={(e) => setSplitMethod(e.target.value)}>
                        <option value="equally">Equally</option>
                        <option value="percentage">By Percentage</option>
                        <option value="absolute">By Value</option>
                    </select>
                    {splitMethod !== 'equally' && members.map((member, index) => (
                        <div key={index}>
                            <label className="share-cost-label">{member} consumed:</label>
                            <input className="share-cost-values" type="number" value={splitMethod === 'percentage' ? memberPercentages[index] : memberSplits[index]} onChange={(e) => handleSplitChange(index, e.target.value)} />
                        </div>
                    ))}
                </div>
                <button type="submit" className="form-submit-button">Update</button>
            </form>
        </div>
    );
};    

export default EditExpense;
