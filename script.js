// Firebase Configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// DOM Ready Function
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication state
    auth.onAuthStateChanged(user => {
        if (user) {
            // User is signed in
            const path = window.location.pathname.split('/').pop();
            
            if (path === 'dashboard.html') {
                // Load dashboard data
                loadFamilyData();
            } else if (path === 'member.html') {
                // Load member data
                loadMemberData();
            } else if (path === 'index.html') {
                // Redirect to appropriate page based on email
                if (user.email.endsWith('@smartx.family')) {
                    window.location.href = 'dashboard.html';
                } else {
                    window.location.href = 'member.html';
                }
            }
        } else {
            // User is signed out
            if (window.location.pathname.split('/').pop() !== 'index.html') {
                window.location.href = 'index.html';
            }
        }
    });
    
    // Initialize year filters
    initializeYearFilters();
});

// ===== AUTHENTICATION FUNCTIONS =====

// 1. Create Family Account
function createFamily() {
    const familyName = document.getElementById('family-name').value.trim();
    const password = document.getElementById('password').value;
    
    if (!familyName || !password) {
        alert("Please fill all fields");
        return;
    }
    
    const familyEmail = `${familyName.toLowerCase().replace(/\s+/g, '')}@smartx.family`;
    
    // Create family account
    auth.createUserWithEmailAndPassword(familyEmail, password)
        .then(userCred => {
            // Create family document in Firestore
            return db.collection('families').doc(userCred.user.uid).set({
                name: familyName,
                members: [{
                    email: familyEmail,
                    role: 'admin',
                    name: 'Admin'
                }],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            alert(`Family "${familyName}" created successfully!`);
            window.location.href = 'dashboard.html';
        })
        .catch(error => {
            alert("Error: " + error.message);
            console.error(error);
        });
}

// 2. Family Login
function loginFamily() {
    const familyName = document.getElementById('family-name').value.trim();
    const password = document.getElementById('password').value;
    
    if (!familyName || !password) {
        alert("Please fill all fields");
        return;
    }
    
    const familyEmail = `${familyName.toLowerCase().replace(/\s+/g, '')}@smartx.family`;
    
    auth.signInWithEmailAndPassword(familyEmail, password)
        .then(() => {
            window.location.href = 'dashboard.html';
        })
        .catch(error => {
            alert("Login failed: " + error.message);
            console.error(error);
        });
}

// 3. Logout
function logout() {
    auth.signOut()
        .then(() => {
            window.location.href = 'index.html';
        })
        .catch(error => {
            alert("Error signing out: " + error.message);
        });
}

// ===== FAMILY DASHBOARD FUNCTIONS =====

// 1. Load Family Data
function loadFamilyData() {
    const familyId = auth.currentUser.uid;
    
    // Load family name
    db.collection('families').doc(familyId).get()
        .then(doc => {
            if (doc.exists) {
                document.getElementById('family-name-display').textContent = doc.data().name;
                loadMembersList(doc.data().members);
            }
        })
        .catch(error => {
            console.error("Error loading family data:", error);
        });
    
    // Load expenses summary and table
    loadExpensesSummary();
    loadExpensesTable();
}

// 2. Add Family Member
function addMember() {
    const email = document.getElementById('member-email').value.trim();
    const password = document.getElementById('member-password').value;
    const familyId = auth.currentUser.uid;
    
    if (!email || !password) {
        alert("Please fill all fields");
        return;
    }
    
    // Create member account
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCred => {
            // Add to family members list
            return db.collection('families').doc(familyId).update({
                members: firebase.firestore.FieldValue.arrayUnion({
                    email: email,
                    role: 'member',
                    name: email.split('@')[0]
                })
            });
        })
        .then(() => {
            alert('Member added successfully!');
            document.getElementById('member-email').value = '';
            document.getElementById('member-password').value = '';
            
            // Refresh members list
            return db.collection('families').doc(familyId).get();
        })
        .then(doc => {
            if (doc.exists) {
                loadMembersList(doc.data().members);
            }
        })
        .catch(error => {
            alert("Error adding member: " + error.message);
            console.error(error);
        });
}

// 3. Load Members List
function loadMembersList(members) {
    const membersList = document.getElementById('members-list');
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

// 4. Load Expenses Summary
function loadExpensesSummary() {
    const familyId = auth.currentUser.uid;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Monthly total
    db.collection('expenses')
        .where('familyId', '==', familyId)
        .where('month', '==', currentMonth)
        .where('year', '==', currentYear)
        .get()
        .then(snapshot => {
            let total = 0;
            snapshot.forEach(doc => {
                total += doc.data().amount;
            });
            document.getElementById('month-total').textContent = `₹${total.toFixed(2)}`;
        });
    
    // Yearly total
    db.collection('expenses')
        .where('familyId', '==', familyId)
        .where('year', '==', currentYear)
        .get()
        .then(snapshot => {
            let total = 0;
            snapshot.forEach(doc => {
                total += doc.data().amount;
            });
            document.getElementById('year-total').textContent = `₹${total.toFixed(2)}`;
        });
}

// 5. Load Expenses Table
function loadExpensesTable(month = '', year = '') {
    const familyId = auth.currentUser.uid;
    let query = db.collection('expenses').where('familyId', '==', familyId);
    
    if (month) {
        query = query.where('month', '==', parseInt(month));
    }
    
    if (year) {
        query = query.where('year', '==', parseInt(year));
    }
    
    query.orderBy('date', 'desc')
        .get()
        .then(snapshot => {
            const tbody = document.getElementById('expenses-table').querySelector('tbody');
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
        });
}

// 6. Filter Expenses
function filterExpenses() {
    const month = document.getElementById('month-filter').value;
    const year = document.getElementById('year-filter').value;
    loadExpensesTable(month, year);
}

// ===== MEMBER FUNCTIONS =====

// 1. Load Member Data
function loadMemberData() {
    const user = auth.currentUser;
    document.getElementById('member-email-display').textContent = user.email;
    
    loadMemberExpensesSummary();
    loadMyExpenses();
}

// 2. Add Expense
function addExpense() {
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
    
    db.collection('expenses').add({
        familyId: user.uid,
        memberEmail: user.email,
        memberName: user.displayName || user.email.split('@')[0],
        name: name,
        amount: amount,
        date: date,
        month: month,
        year: year,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Expense added successfully!');
        document.getElementById('expense-name').value = '';
        document.getElementById('expense-amount').value = '';
        document.getElementById('expense-date').value = '';
        
        // Refresh data
        loadMemberExpensesSummary();
        loadMyExpenses();
    })
    .catch(error => {
        alert("Error adding expense: " + error.message);
        console.error(error);
    });
}

// 3. Load Member Expenses Summary
function loadMemberExpensesSummary() {
    const user = auth.currentUser;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    
    // Monthly total
    db.collection('expenses')
        .where('familyId', '==', user.uid)
        .where('memberEmail', '==', user.email)
        .where('month', '==', currentMonth)
        .where('year', '==', currentYear)
        .get()
        .then(snapshot => {
            let total = 0;
            snapshot.forEach(doc => {
                total += doc.data().amount;
            });
            document.getElementById('my-month-total').textContent = `₹${total.toFixed(2)}`;
        });
    
    // Yearly total
    db.collection('expenses')
        .where('familyId', '==', user.uid)
        .where('memberEmail', '==', user.email)
        .where('year', '==', currentYear)
        .get()
        .then(snapshot => {
            let total = 0;
            snapshot.forEach(doc => {
                total += doc.data().amount;
            });
            document.getElementById('my-year-total').textContent = `₹${total.toFixed(2)}`;
        });
}

// 4. Load My Expenses
function loadMyExpenses(month = '', year = '') {
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
    
    query.orderBy('date', 'desc')
        .get()
        .then(snapshot => {
            const tbody = document.getElementById('my-expenses').querySelector('tbody');
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
                        <button onclick="deleteExpense('${doc.id}')" class="danger">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        });
}

// 5. Filter My Expenses
function filterMyExpenses() {
    const month = document.getElementById('my-month-filter').value;
    const year = document.getElementById('my-year-filter').value;
    loadMyExpenses(month, year);
}

// 6. Delete Expense
function deleteExpense(expenseId) {
    if (confirm("Are you sure you want to delete this expense?")) {
        db.collection('expenses').doc(expenseId).delete()
            .then(() => {
                alert("Expense deleted successfully");
                loadMemberExpensesSummary();
                loadMyExpenses();
            })
            .catch(error => {
                alert("Error deleting expense: " + error.message);
            });
    }
}

// ===== HELPER FUNCTIONS =====

// 1. Format Date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// 2. Initialize Year Filters
function initializeYearFilters() {
    const currentYear = new Date().getFullYear();
    const yearFilters = document.querySelectorAll('select[id$="year-filter"]');
    
    yearFilters.forEach(filter => {
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
