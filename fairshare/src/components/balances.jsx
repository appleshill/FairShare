import React, { useEffect, useState, useReducer } from 'react';
import { useParams } from 'react-router-dom';
import { doc, setDoc, serverTimestamp, collection, getDoc, query, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const initialState = {
    members: [],
    matrix: [],
    simplifiedTransactions: [] 
};


function reducer(state, action) {
    switch (action.type) {
        case 'SET_MEMBERS':
            return {
                ...state,
                members: action.payload,
                matrix: action.payload.map(() => new Array(action.payload.length).fill(0)),
            };
        case 'UPDATE_MATRIX':
            const newMatrix = state.matrix.map(row => [...row]);
            updateMatrix(newMatrix, state.members, action.payload);
            return {
                ...state,
                matrix: newMatrix,
            };
        case 'SET_SIMPLIFIED_TRANSACTIONS':
            return {
                ...state,
                simplifiedTransactions: action.payload
            };
        default:
            return state;
    }
}


const updateMatrix = (matrix, members, transaction) => {
    const { paymentShares, consumedBy, amountsConsumed, paidBy } = transaction;

    
    const memberIndex = {};
    members.forEach((member, index) => {
        memberIndex[member] = index;
    });

    console.log('Member index mapping:', memberIndex);

    if (paidBy === "Multiple" && paymentShares) {
        paymentShares.forEach((amount, payerIndex) => {
            amountsConsumed.forEach((consumeAmount, consumeIndex) => {
                const payerName = consumedBy[payerIndex]; 
                const consumerName = consumedBy[consumeIndex]; 
                const payAmount = parseFloat(amount);
                const consumeValue = parseFloat(consumeAmount);
                if (payerName !== consumerName) {
                    matrix[memberIndex[payerName]][memberIndex[consumerName]] += (payAmount / amountsConsumed.length) - consumeValue;
                }

                console.log(`Updated matrix[${memberIndex[payerName]}][${memberIndex[consumerName]}]: ${matrix[memberIndex[payerName]][memberIndex[consumerName]]}`);
            });
        });
    } else {
        const payerIndex = memberIndex[paidBy];
        amountsConsumed.forEach((consumeAmount, index) => {
            const consumerName = consumedBy[index];
            const totalValue = parseFloat(consumeAmount);
            if (paidBy !== consumerName) {
                matrix[payerIndex][memberIndex[consumerName]] += totalValue;
            }

            console.log(`Updated matrix[${payerIndex}][${memberIndex[consumerName]}]: ${matrix[payerIndex][memberIndex[consumerName]]}`);
        });
    }
};

const simplifyDebts = (matrix, members) => {
    const netAmounts = members.map((_, i) => {
        let net = 0;
        for (let j = 0; j < matrix.length; j++) {
            net += matrix[j][i]; 
            net -= matrix[i][j]; 
        }
        return net;
    });

    console.log("Net amounts for each member:", netAmounts.map((n, i) => `${members[i]}: ${n.toFixed(2)}`));

    const transactions = [];

    // Simplify debts
    let creditors = [];
    let debtors = [];

    netAmounts.forEach((amount, index) => {
        if (amount > 0) {
            creditors.push({ index, amount });
        } else if (amount < 0) {
            debtors.push({ index, amount: -amount });
        }
    });

    while (debtors.length && creditors.length) {
        const debtor = debtors[0];
        const creditor = creditors[0];
        const minAmount = Math.min(debtor.amount, creditor.amount);

        transactions.push({
            from: members[debtor.index],
            to: members[creditor.index],
            amount: minAmount
        });

        // Update amounts
        debtor.amount -= minAmount;
        creditor.amount -= minAmount;

        if (debtor.amount === 0) debtors.shift();
        if (creditor.amount === 0) creditors.shift();
    }

    return transactions;
};



const Balances = () => {
    const { groupName } = useParams();
    const [transactions, setTransactions] = useState([]);
    const [members, setMembers] = useState([]); // List of member identifiers
    const [matrix, setMatrix] = useState([]);
    const [arraysFilled, setArraysFilled] = useState(false);
    const [state, dispatch] = useReducer(reducer, initialState);


    useEffect(() => {
        const fetchMembersAndTransactions = async () => {
            const groupDocRef = doc(db, "Groups", groupName);
            const groupDocSnap = await getDoc(groupDocRef);
            if (!groupDocSnap.exists()) {
                console.log('No group found for:', groupName);
                return;
            }
    
            const groupData = groupDocSnap.data();
            dispatch({ type: 'SET_MEMBERS', payload: groupData.membersNames });
    
            const transactionQuery = query(collection(db, "Groups", groupName, "Expenses"));
            const querySnapshot = await getDocs(transactionQuery);
            querySnapshot.forEach(doc => {
                dispatch({ type: 'UPDATE_MATRIX', payload: doc.data() });
            });
        };
    
        if (!arraysFilled) {
            fetchMembersAndTransactions();
            setArraysFilled(true);
        }
    }, [groupName, arraysFilled]);
    
    // Effect to handle debt simplification
    useEffect(() => {
        if (state.matrix.length > 0 && state.members.length > 0) {
            const transactions = simplifyDebts(state.matrix, state.members);
            console.log("Simplified Transactions:", transactions);
            dispatch({ type: 'SET_SIMPLIFIED_TRANSACTIONS', payload: transactions });
        }
    }, [state.matrix, state.members]);
        

    return (
        <div className="balances-container">
            <h1>Debt Balances for {groupName}</h1>
            <h2>Simplified Transactions</h2>
            {state.simplifiedTransactions && state.simplifiedTransactions.length > 0 ? (
                <ul>
                    {state.simplifiedTransactions.map((transaction, index) => (
                        <li key={index}>
                            {transaction.from} owes {transaction.to} ${transaction.amount.toFixed(2)}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No transactions to display.</p>
            )}
            <table>
                <thead>
                    <tr>
                        <th>Member</th>
                        {state.members.map(member => (
                            <th key={member}>{member}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {state.matrix.map((row, index) => (
                        <tr key={state.members[index]}>
                            <td>{state.members[index]}</td>
                            {row.map((value, colIndex) => (
                                <td key={colIndex}>{value.toFixed(2)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
    
};


export default Balances;
