// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBpg4XBr-tf7Gkagdh8iBVNzJ91oWMCE38",
    authDomain: "smartx-nv.firebaseapp.com",
    projectId: "smartx-nv",
    storageBucket: "smartx-nv.appspot.com",
    messagingSenderId: "348904437504",
    appId: "1:348904437504:web:57ed3b7738bdcfee4b25e5",
    measurementId: "G-13QNMH37B1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Elements
const elements = {
    // Login Page
    loginBtn: document.getElementById('login-btn'),
    createFamilyBtn: document.getElementById('create-family-btn'),
    familyNameInput: document.getElementById('family-name'),
    passwordInput: document.getElementById('password'),

    // Dashboard Page
    logoutBtn: document.getElementById('logout-btn'),
    addMemberBtn: document.getElementById('add-member-btn'),
    memberLoginBtn: document.getElementById('member-login-btn'),
    filterBtn: document.getElementById('filter-btn'),
    familyNameDisplay: document.getElementById('family-name-display'),
    membersList: document.getElementById('members-list'),
    monthTotal: document.getElementById('month-total'),
    yearTotal: document.getElementById('year-total'),
    expensesTable: document.getElementById('expenses-table'),

    // Member Page
    addExpenseBtn: document.getElementById('add-expense-btn'),
    myFilterBtn: document.getElementById('my-filter-btn'),
    memberEmailDisplay: document.getElementById('member-email-display'),
    myMonthTotal: document.getElementById('my-month-total'),
    myYearTotal: document.getElementById('my-year-total'),
    myExpensesTable: document.getElementById('my-expenses')
};

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize based on current page
    const path = window.location.pathname.split('/').pop();
    
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            if (path === 'dashboard.html') {
                initDashboard();
            } else if (path === 'member.html') {
                initMemberPage();
            } else if (path === 'index.html') {
                // Redirect based on user type
                if (user.email.endsWith('@smartx.family')) {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'member.html';
                }
            }
        } else {
            // No user signed in
            if (path !== 'index.html') {
                window.location.href = 'index.html';
            } else {
                initLoginPage();
            }
        }
    });
});

function initLoginPage() {
    if (elements.loginBtn && elements.createFamilyBtn) {
        elements.loginBtn.addEventListener('click', loginFamily);
        elements.createFamilyBtn.addEventListener('click', createFamily);
    }
}

function initDashboard() {
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', logout);
    if (elements.addMemberBtn) elements.addMemberBtn.addEventListener('click', addMember);
    if (elements.memberLoginBtn) elements.memberLoginBtn.addEventListener('click', loginMember);
    if (elements.filterBtn) elements.filterBtn.addEventListener('click', filterExpenses);
    
    loadFamilyData();
    initializeYearFilters();
}

function initMemberPage() {
    if (elements.logoutBtn) elements.logoutBtn.addEventListener('click', logout);
    if (elements.addExpenseBtn) elements.addExpenseBtn.addEventListener('click', addExpense);
    if (elements.myFilterBtn) elements.myFilterBtn.addEventListener('click', filterMyExpenses);
    
    loadMemberData();
    initializeYearFilters();
}

// Core Functions
async function createFamily() {
    const familyName = elements.familyNameInput.value.trim();
    const password = elements.passwordInput.value;
    
    if (!familyName || !password) {
        alert("Please fill all fields");
        return;
    }
    
    const familyEmail = `${familyName.toLowerCase().replace(/\s+/g, '')}@smartx.family`;
    
    try {
        // Create family account
        const userCred = await auth.createUserWithEmailAndPassword(familyEmail, password);
        
        // Create family document in Firestore
        await db.collection('families').doc(userCred.user.uid).set({
            name: familyName,
            members: [{
                email: familyEmail,
                role: 'admin',
                name: 'Admin'
            }],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert(`Family "${familyName}" created successfully!`);
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert("Error: " + error.message);
        console.error(error);
    }
}

async function loginFamily() {
    const familyName = elements.familyNameInput.value.trim();
    const password = elements.passwordInput.value;
    
    if (!familyName || !password) {
        alert("Please fill all fields");
        return;
    }
    
    const familyEmail = `${familyName.toLowerCase().replace(/\s+/g, '')}@smartx.family`;
    
    try {
        await auth.signInWithEmailAndPassword(familyEmail, password);
        window.location.href = 'dashboard.html';
    } catch (error) {
        alert("Login failed: " + error.message);
        console.error(error);
    }
}

async function addMember() {
    const email = document.getElementById('member-email').value.trim();
    const password = document.getElementById('member-password').value;
    const familyId = auth.currentUser.uid;
    
    if (!email || !password) {
        alert("Please fill all fields");
        return;
    }
    
    try {
        // Create member account
        await auth.createUserWithEmailAndPassword(email, password);
        
        // Add to family members list
        await db.collection('families').doc(familyId).update({
            members: firebase.firestore.FieldValue.arrayUnion({
                email: email,
                role: 'member',
                name: email.split('@')[0]
            })
        });
        
        alert('Member added successfully!');
        document.getElementById('member-email').value = '';
        document.getElementById('member-password').value = '';
        
        // Refresh members list
        loadFamilyData();
    } catch (error) {
        alert("Error adding member: " + error.message);
        console.error(error);
    }
}

async function loginMember() {
    const email = document.getElementById('
