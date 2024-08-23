const SettleBigDebt = (matrix, members) => {
    const balances = members.map((_, i) => {
        let balance = 0;
        for (let j = 0; j < members.length; j++) {
            balance += matrix[j][i] - matrix[i][j];
        }
        return { name: members[i], balance };
    });

    console.log("Initial balances:", balances);

    balances.sort((a, b) => a.balance - b.balance);

    const transactions = [];
    let i = 0, j = balances.length - 1;

    console.log("Starting settlement process...");

    while (i < j) {
        const debtor = balances[i];
        const creditor = balances[j];
        const amount = Math.min(-debtor.balance, creditor.balance);

        transactions.push({ from: debtor.name, to: creditor.name, amount });
        console.log(`Transaction: ${debtor.name} pays ${creditor.name} $${amount.toFixed(2)}`);

        debtor.balance += amount;
        creditor.balance -= amount;

        if (debtor.balance === 0) i++;
        if (creditor.balance === 0) j--;
    }

    return transactions;
};

export default SettleBigDebt;
