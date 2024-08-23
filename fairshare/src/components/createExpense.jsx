import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, collection, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import SettleDebt from './settleDebt';

const CreateExpense = () => {
    const { groupName } = useParams();
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
    const [arraysFilled, setArraysFilled] = useState(false);
    const [profileExpanded, setProfileExpanded] = useState(false);
    const [selectedPayer, setSelectedPayer] = useState('');
    const navigate = useNavigate();

    const editProfile = () => {
        navigate('/edit-profile');
    }

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

    const goHome = () => {
        navigate('/home');
    }


    useEffect(() => {
        const fetchGroupDetails = async () => {
            if (!groupName) return;
            const groupRef = doc(db, "Groups", groupName);
            const docSnap = await getDoc(groupRef);

            if (docSnap.exists()) {
                const groupData = docSnap.data();
                setMembers(groupData.membersNames || []);
                setPaymentShares(new Array(groupData.membersNames.length).fill(0));
                initializeSplits(groupData.membersNames.length);
                if (groupData.membersNames.length > 0) {
                    setSelectedPayer(groupData.membersNames[0]);
                }
                // console.log(members);
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
        if (!arraysFilled) {
            fetchGroupDetails();
            fetchUserProfile();
            setArraysFilled(true);
        }
        
    }, [groupName, members, memberSplits, memberPercentages, arraysFilled]);

    // who paid
    const handlePaidByChange = (e) => {
        console.log("HandlePaidByChange");
        const selectedValue = e.target.value;
        if (selectedValue === "Multiple People") {
            setPaidByMultiple(true);
            setSelectedPayer(''); 
        } else {
            setPaidByMultiple(false);
            setSelectedPayer(selectedValue); 
        }
    };    

    const handlePaymentChange = (index, value) => {
        let newShares = [...paymentShares];
        newShares[index] = value;
        setPaymentShares(newShares);
    };

    // who consumed
    const initializeSplits = (memberCount) => {
        setMemberSplits(new Array(memberCount).fill(0));
        setMemberPercentages(new Array(memberCount).fill(0));
    };

    const handleSplitMethodChange = (e) => {
        setSplitMethod(e.target.value);
    };

    const handleSplitChange = (index, value) => {
        const numericValue = parseFloat(value); 
        if (splitMethod === 'percentage') {
            let newPercentages = [...memberPercentages];
            newPercentages[index] = numericValue;
            setMemberPercentages(newPercentages);

        } else if (splitMethod === 'value') {
            let newSplits = [...memberSplits];
            newSplits[index] = numericValue;
            setMemberSplits(newSplits);

        }
    };
    
    const convertPercentagesToAmounts = (percentages, totalCost) => {
        return percentages.map(percentage => parseFloat((percentage / 100 * totalCost).toFixed(2)));
    };
    
    
    const handleSubmit = async (event) => {
        event.preventDefault();
        let currentMemberSplits = memberSplits;

        let updatedPaymentShares = [...paymentShares];

        if (splitMethod === 'percentage') {
            const totalPercentage = memberPercentages.reduce((acc, current) => acc + parseFloat(current), 0);
            if (Math.abs(totalPercentage - 100) > 0.01) {
                alert(`The total percentage of ${totalPercentage.toFixed(2)}% does not add up to 100%. Please adjust the percentages.`);
                return;
            }
            currentMemberSplits = convertPercentagesToAmounts(memberPercentages, cost);
        }
    
        if (paidByMultiple) {
            const totalPaid = paymentShares.reduce((acc, current) => acc + Number(current), 0);
            if (Math.abs(totalPaid - Number(cost)) > 0.1) {
                alert(`The total payments of $${totalPaid.toFixed(2)} do not match the total cost of $${cost}. Please adjust the amounts.`);
                return;
            }
        } else {
            const payerIndex = members.indexOf(selectedPayer);
            updatedPaymentShares = new Array(members.length).fill(0);
            updatedPaymentShares[payerIndex] = parseFloat(cost);
        }

        if (splitMethod === 'value') {
            const totalPaid = currentMemberSplits.reduce((acc, current) => acc + parseFloat(current), 0);
            if (Math.abs(totalPaid - parseFloat(cost)) > 0.01) {
                alert(`The total payments of $${totalPaid.toFixed(2)} do not match the total cost of $${cost}. Please adjust the amounts.`);
                return;
            }
        }
        if (splitMethod === 'equally') {
            currentMemberSplits = new Array(members.length).fill((cost / members.length).toFixed(2));
        }
        const netAmounts = {};
        members.forEach((member, index) => {
            const paid = parseFloat(updatedPaymentShares[index] || 0);  
            const consumed = parseFloat(currentMemberSplits[index] || 0);  
            console.log(member + " paid: " + paid + "consumed " + consumed);
            netAmounts[member] = paid - consumed;
        });
        const simplifiedTransactions = SettleDebt(netAmounts);

        const expenseRef = doc(collection(db, "Groups", groupName, "Expenses"));
        const expenseData = {
            name: title,
            totalValue: Number(cost),
            notes,
            createdAt: serverTimestamp(),
            paidBy: paidByMultiple ? "Multiple" : selectedPayer,
            paymentShares: updatedPaymentShares,
            memberPercentages: splitMethod === 'percentage' ? memberPercentages : [],
            splitMethod,
            amountsConsumed: currentMemberSplits,
            consumedBy: members,
            netAmounts: netAmounts,
            Debts: simplifiedTransactions,
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
            console.log(selectedPayer);
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
                    <select className="form-select" value={selectedPayer} onChange={handlePaidByChange}>
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
                    <select className="form-select" value={splitMethod} onChange={handleSplitMethodChange}>
                        <option value="equally">Equally</option>
                        <option value="percentage">Split by Percentage</option>
                        <option value="value">Split by Value</option>
                    </select>
                    {splitMethod !== 'equally' && members.map((member, index) => (
                    <div key={index}>
                        <label className="share-cost-label">{member} consumed:</label>
                            <input className="share-cost-values" type="number" onChange={e => handleSplitChange(index, e.target.value)} />
                    </div>
                    ))}
                </div>
                <button type="submit" className="form-submit-button">Done</button>
            </form>

        </div>
    );
};

export default CreateExpense;