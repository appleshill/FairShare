import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, collection, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const ViewExpense = () => {
    const { groupName, expenseId } = useParams(); // Assuming URL param names
    const [expense, setExpense] = useState(null);
    const [groupInfo, setGroupInfo] = useState(null);
    const [participants, setParticipants] = useState([]);
    const navigate = useNavigate();

    const goHome = () => {
        navigate('/home');
    }

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

                const paid = memberName === expenseData.paidBy ? expenseData.totalValue : 0;
                const individualShare = expenseData.amountsConsumed[index];
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

        

        const fetchGroupInfo = async () => {
            if (!groupName) return;
            const groupRef = doc(db, "Groups", groupName);
            const groupSnap = await getDoc(groupRef);
            if (groupSnap.exists()) {
                setGroupInfo(groupSnap.data());
            } else {
                console.log("Group not found");
            }
        };

        fetchGroupAndExpenseDetails();
        fetchGroupInfo();
    }, [groupName, expenseId]);

    return (
        <div className="view-expense-container">
            <div className="header-container">
                <div className="profile-fab-container">
                        <button aria-label="Home button" className ="home-icon-button" onClick={goHome}>
                            <img src="/home.svg" alt="Home-button" className="home-icon-button" />
                        </button>
                    <div className="expense-edit-delete">
                        <button onClick={() => console.log('Edit')}><img src="/edit.svg" alt="Edit" className="edit-button"/></button>
                        <button onClick={() => console.log('Delete')}><img src="/delete.svg" alt="Delete" className="delete-button"/></button>
                    </div>
                </div>
            </div>
            <div className="group-info">
            <h1 className="group-name">{groupInfo?.groupName || 'Loading...'}</h1>
            <img src={groupInfo?.groupPicture || 'https://upload.wikimedia.org/wikipedia/commons/8/84/Question_Mark_Icon.png'} alt="Group" className="group-icon" />
            </div>
            <div className="expense-details">
                <h2>{expense?.name || 'Loading...'}</h2>
                <h3>Total Value: ${expense?.totalValue}</h3>
                {participants.map((participant, index) => (
                    <div key={index} className="participant-info">
                        <img src={participant.profilePicture} alt={participant.name} className="participant-profile-image"/>
                        {participant.paid > 0 && <p>{participant.name} paid ${participant.paid}</p>}
                        {participant.owes > 0 && <p>{participant.name} owes ${participant.owes}</p>}
                    </div>
                ))}
            </div>
            <button onClick={() => navigate(-1)}>Done</button>
        </div>
    );
};

export default ViewExpense;
