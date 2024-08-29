# FairShare: A Bill-Splitting Web Application

Welcome to FairShare, a web application designed to simplify the process of splitting bills. Built out of personal need and frustration with existing solutions that are often laden with ads, FairShare offers a clean, ad-free experience for managing shared expenses among friends or groups.

## Live Demo

Check out the fully functional live demo here: [FairShare Live](https://fairshare-afe2a.web.app/profile-exists-check)

## Features

- **Create Groups**: Organize your contacts into groups for shared expenses.
- **Add Expenses**: Easily add expenses and specify who paid and how the cost should be split.
- **Edit Expenses**: Adjust expense details as needed.
- **Debt Settlement**: Calculate how debts can be settled in the simplest way possible.
- **User Profiles**: Manage user profiles within the group.
- **Responsive Design**: Accessible on both desktop and mobile devices.

## Project Structure

```plaintext
fairshare/
├── README.md
├── build/
├── favicon.png
├── node_modules/
├── package-lock.json
├── package.json
├── public/
│   ├── index.html
│   └── other assets
└── src/
    ├── components/
    │   ├── NewUserProfileForm.jsx
    │   ├── confirmationModal.jsx
    │   ├── createExpense.jsx
    │   ├── editExpense.jsx
    │   ├── editProfile.jsx
    │   ├── frontPage.jsx
    │   ├── homePage.jsx
    │   ├── joinGroup.jsx
    │   ├── mainGroupPage.jsx
    │   ├── viewExpense.jsx
    │   └── ...
    ├── generateCode.js
    ├── solveDebtsLP.js
    ├── settleBigDebt.js
    ├── settleDebt.js
    └── viewTotals.jsx
```


### File Descriptions

- **NewUserProfileForm.jsx**: Handles new user profile creation.
- **createExpense.jsx**: Allows users to add new expenses.
- **editExpense.jsx**: Provides functionality to edit existing expenses.
- **viewExpense.jsx**: Displays detailed views of individual expenses.
- **homePage.jsx**: The main dashboard view for users after login.
- **joinGroup.jsx**: Interface for joining an existing group.
- **mainGroupPage.jsx**: Main page for group-specific actions and views.

## Setup and Running Locally

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/fairshare.git
   cd fairshare
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Run the Application**

   ```bash
   npm start
   ```

This will run the app in development mode. Open http://localhost:3000 to view it in the browser. The page will reload if you make edits.

**Contributing**

Contributions to FairShare are welcome! Feel free to report issues, suggest features, or open pull requests.
