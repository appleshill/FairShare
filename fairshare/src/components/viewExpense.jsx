import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, collection, getDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ViewExpense = () => {
    const { groupName, expenseId } = useParams(); 
    const [expense, setExpense] = useState(null);
    const [groupInfo, setGroupInfo] = useState(null);
    const [participants, setParticipants] = useState([]);
    const navigate = useNavigate();

    const goHome = () => {
        navigate('/home');
    }

    const goEdit = () => {
        navigate(`/group/${groupName}/edit-expense/${expenseId}`);
    }

    const handleDeleteExpense = async () => {
        const expenseRef = doc(db, "Groups", groupName, "Expenses", expenseId);
    
        try {
            await deleteDoc(expenseRef);
            console.log('Expense deleted successfully');
            navigate(`/group/${groupName}`);  
        } catch (error) {
            console.error("Error deleting expense: ", error);
        }
    };

    useEffect(() => {
        const fetchGroupAndExpenseDetails = async () => {
            const groupRef = doc(db, "Groups", groupName);
            const groupSnap = await getDoc(groupRef);
            if (!groupSnap.exists()) {
                console.log("Group not found");
                return;
            }

            setGroupInfo(groupSnap.data());

            const expenseRef = doc(db, "Groups", groupName, "Expenses", expenseId);
            const expenseSnap = await getDoc(expenseRef);
            if (!expenseSnap.exists()) {
                console.log("Expense not found");
                return;
            }

            const expenseData = expenseSnap.data();
            setExpense(expenseData);

            const participantDetails = await Promise.all(expenseData.consumedBy.map(async (memberName, index) => {
                const memberIndex = groupSnap.data().membersNames.indexOf(memberName);
                const memberId = groupSnap.data().members[memberIndex];
                const userRef = doc(db, "Users", memberId);
                const userSnap = await getDoc(userRef);

                let paid = 0;
                if (expenseData.paidBy === "Multiple") {
                    paid = parseFloat(expenseData.paymentShares[index]);
                } else if (expenseData.paidBy === memberName) {
                    paid = expenseData.totalValue;
                }

                const individualShare = parseFloat(expenseData.amountsConsumed[index]);
                const owes = Math.max(individualShare - paid, 0);

                return {
                    name: memberName,
                    paid,
                    owes,
                    profilePicture: userSnap.exists() ? userSnap.data().profilePicture : "https://upload.wikimedia.org/wikipedia/commons/8/89/Portrait_Placeholder.png"
                };
            }));

            setParticipants(participantDetails);
        };

        fetchGroupAndExpenseDetails();
    }, [groupName, expenseId]);


        
    return (
        <div className="view-expense-container">
            <div className="header-container">
                <div className="profile-fab-container">
                    <button aria-label="Home button" className ="home-icon-button" onClick={goHome}>
                        <img src="/home.svg" alt="Home-button" className="home-icon-button" />
                    </button>
                    <div className="expense-edit-delete">
                        <button onClick={goEdit}>
                            <img src="https://firebasestorage.googleapis.com/v0/b/fairshare-afe2a.appspot.com/o/edit.svg?alt=media&token=2a4e5f9c-cb58-499a-a9ad-b97a0a3662c6" alt="Edit" className="edit-button"/>
                        </button>
                        <button onClick={handleDeleteExpense}>
                            <img src="https://firebasestorage.googleapis.com/v0/b/fairshare-afe2a.appspot.com/o/delete.svg?alt=media&token=cb020acc-4960-4663-aadf-1882b5df0ce2" alt="Delete" className="delete-button"/>
                        </button>
                    </div>
                </div>
            </div>
            <div className="group-info">
                <h1 className="group-name">{groupInfo?.groupName || 'Loading...'}</h1>
                <img src={groupInfo?.groupPicture || 'https://upload.wikimedia.org/wikipedia/commons/8/84/Question_Mark_Icon.png'} alt="Group" className="group-icon" />
            </div>
            <div className="expense-details">
                <h2>{expense?.name || 'Loading...'}</h2>
                <h3>Total Value: ${expense?.totalValue.toFixed(2)}</h3>
                <p>Split Method: {expense?.splitMethod || 'Loading...'}</p>
                {participants.map((participant, index) => (
                    <div key={index} className="members-list">
                        <img src={participant.profilePicture} alt={participant.name} className="participant-profile-image"/>
                        {participant.paid > 0 && <p>{participant.name} paid ${participant.paid.toFixed(2)}</p>}
                        {participant.owes > 0 && <p>{participant.name} owes ${participant.owes.toFixed(2)}</p>}
                    </div>
                ))}
            </div>
            <button onClick={() => navigate(-1)}>Done</button>
        </div>
    );
};

export default ViewExpense;
