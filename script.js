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
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
        alert("Please fill all fields");
        return;
    }
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = 'member.html';
    } catch (error) {
        alert("Login failed: " + error.message);
        console.error(error);
    }
}

function logout() {
    auth.signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch(error => {
            alert("Error signing out: " + error.message);
        });
}

// Data Loading Functions
async function loadFamilyData() {
    const familyId = auth.currentUser.uid;
    
    try {
        // Load family name
        const familyDoc = await db.collection('families').doc(familyId).get();
        if (familyDoc.exists) {
            elements.familyNameDisplay.textContent = familyDoc.data().name;
            loadMembersList(familyDoc.data().members);
        }
        
        // Load expenses summary and table
        loadExpensesSummary();
        loadExpensesTable();
    } catch (error) {
        console.error("Error loading family data:", error);
    }
}

function loadMembersList(members) {
    const membersList = document.getElementById('members-list');
    if (!membersList) return;
    
    membersList.innerHTML = '';
    
    members.forEach(member => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${member.name || member.email}</span>
            <span>${member.role}</span>
        `;
        membersList.appendChild(li);
    });
}

async function loadExpensesSummary() {
    const familyId = auth.currentUser.uid;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    try {
        // Monthly total
        const monthSnapshot = await db.collection('expenses')
            .where('familyId', '==', familyId)
            .where('month', '==', currentMonth)
            .where('year', '==', currentYear)
            .get();
        
        let monthTotal = 0;
        monthSnapshot.forEach(doc => {
            monthTotal += doc.data().amount;
        });
        elements.monthTotal.textContent = `₹${monthTotal.toFixed(2)}`;
        
        // Yearly total
        const yearSnapshot = await db.collection('expenses')
            .where('familyId', '==', familyId)
            .where('year', '==', currentYear)
            .get();
        
        let yearTotal = 0;
        yearSnapshot.forEach(doc => {
            yearTotal += doc.data().amount;
        });
        elements.yearTotal.textContent = `₹${yearTotal.toFixed(2)}`;
    } catch (error) {
        console.error("Error loading expenses summary:", error);
    }
}

async function loadExpensesTable(month = '', year = '') {
    const familyId = auth.currentUser.uid;
    let query = db.collection('expenses').where('familyId', '==', familyId);
    
    if (month) {
        query = query.where('month', '==', parseInt(month));
    }
    
    if (year) {
        query = query.where('year', '==', parseInt(year));
    }
    
    try {
        const snapshot = await query.orderBy('date', 'desc').get();
        const tbody = document.querySelector('#expenses-table tbody');
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="4" style="text-align: center;">No expenses found</td>';
            tbody.appendChild(tr);
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatDate(data.date)}</td>
                <td>${data.memberName || data.memberEmail.split('@')[0]}</td>
                <td>${data.name}</td>
                <td>₹${data.amount.toFixed(2)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error loading expenses table:", error);
    }
}

// Member Page Functions
async function loadMemberData() {
    const user = auth.currentUser;
    document.getElementById('member-email-display').textContent = user.email;
    
    loadMemberExpensesSummary();
    loadMyExpenses();
}

async function addExpense() {
    const name = document.getElementById('expense-name').value.trim();
    const amount = parseFloat(document.getElementById('expense-amount').value);
    let date = document.getElementById('expense-date').value;
    const user = auth.currentUser;
    
    if (!name || isNaN(amount)) {
        alert("Please fill all fields correctly");
        return;
    }
    
    // Use current date if not provided
    if (!date) {
        const today = new Date();
        date = today.toISOString().split('T')[0];
    }
    
    const expenseDate = new Date(date);
    const month = expenseDate.getMonth() + 1;
    const year = expenseDate.getFullYear();
    
    try {
        await db.collection('expenses').add({
            familyId: user.uid,
            memberEmail: user.email,
            memberName: user.displayName || user.email.split('@')[0],
            name: name,
            amount: amount,
            date: date,
            month: month,
            year: year,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert('Expense added successfully!');
        document.getElementById('expense-name').value = '';
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-date').value = '';
        
        // Refresh data
        loadMemberExpensesSummary();
        loadMyExpenses();
    } catch (error) {
        alert("Error adding expense: " + error.message);
        console.error(error);
    }
}

async function loadMemberExpensesSummary() {
    const user = auth.currentUser;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    try {
        // Monthly total
        const monthSnapshot = await db.collection('expenses')
            .where('familyId', '==', user.uid)
            .where('memberEmail', '==', user.email)
            .where('month', '==', currentMonth)
            .where('year', '==', currentYear)
            .get();
        
        let monthTotal = 0;
        monthSnapshot.forEach(doc => {
            monthTotal += doc.data().amount;
        });
        document.getElementById('my-month-total').textContent = `₹${monthTotal.toFixed(2)}`;
        
        // Yearly total
        const yearSnapshot = await db.collection('expenses')
            .where('familyId', '==', user.uid)
            .where('memberEmail', '==', user.email)
            .where('year', '==', currentYear)
            .get();
        
        let yearTotal = 0;
        yearSnapshot.forEach(doc => {
            yearTotal += doc.data().amount;
        });
        document.getElementById('my-year-total').textContent = `₹${yearTotal.toFixed(2)}`;
    } catch (error) {
        console.error("Error loading member expenses summary:", error);
    }
}

async function loadMyExpenses(month = '', year = '') {
    const user = auth.currentUser;
    let query = db.collection('expenses')
        .where('familyId', '==', user.uid)
        .where('memberEmail', '==', user.email);
    
    if (month) {
        query = query.where('month', '==', parseInt(month));
    }
    
    if (year) {
        query = query.where('year', '==', parseInt(year));
    }
    
    try {
        const snapshot = await query.orderBy('date', 'desc').get();
        const tbody = document.querySelector('#my-expenses tbody');
        tbody.innerHTML = '';
        
        if (snapshot.empty) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="4" style="text-align: center;">No expenses found</td>';
            tbody.appendChild(tr);
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${formatDate(data.date)}</td>
                <td>${data.name}</td>
                <td>₹${data.amount.toFixed(2)}</td>
                <td>
                    <button onclick="deleteExpense('${doc.id}')" class="danger-btn">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error("Error loading my expenses:", error);
    }
}

async function deleteExpense(expenseId) {
    if (confirm("Are you sure you want to delete this expense?")) {
        try {
            await db.collection('expenses').doc(expenseId).delete();
            alert("Expense deleted successfully");
            loadMemberExpensesSummary();
            loadMyExpenses();
        } catch (error) {
            alert("Error deleting expense: " + error.message);
        }
    }
}

// Helper Functions
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

function initializeYearFilters() {
    const currentYear = new Date().getFullYear();
    const yearFilters = document.querySelectorAll('select[id$="year-filter"]');
    
    yearFilters.forEach(filter => {
        // Clear existing options
        filter.innerHTML = '<option value="">All Years</option>';
        
        // Add 5 years in past and future
        for (let year = currentYear - 5; year <= currentYear + 5; year++) {
            const option = document.createElement('option');
            option.value = year;
            option.textContent = year;
            filter.appendChild(option);
            
            // Select current year
            if (year === currentYear) {
                option.selected = true;
            }
        }
    });
}

function filterExpenses() {
    const month = document.getElementById('month-filter').value;
    const year = document.getElementById('year-filter').value;
    loadExpensesTable(month, year);
}

function filterMyExpenses() {
    const month = document.getElementById('my-month-filter').value;
    const year = document.getElementById('my-year-filter').value;
    loadMyExpenses(month, year);
}

// Make functions available globally for HTML onclick attributes
window.loginFamily = loginFamily;
window.createFamily = createFamily;
window.logout = logout;
window.addMember = addMember;
window.loginMember = loginMember;
window.addExpense = addExpense;
window.deleteExpense = deleteExpense;
window.filterExpenses = filterExpenses;
window.filterMyExpenses = filterMyExpenses;
