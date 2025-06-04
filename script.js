// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBpg4XBr-tf7Gkagdh8iBVNzJ91oWMCE38",
  authDomain: "smartx-nv.firebaseapp.com",
  projectId: "smartx-nv",
  storageBucket: "smartx-nv.firebasestorage.app",
  messagingSenderId: "348904437504",
  appId: "1:348904437504:web:57ed3b7738bdcfee4b25e5",
  measurementId: "G-13QNMH37B1"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== FAMILY AUTHENTICATION =====
function signupFamily() {
    const email = document.getElementById('family-email').value;
    const password = document.getElementById('family-password').value;
    
    if (!email || !password) {
        alert('Please fill all fields');
        return;
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // Create family document
            return db.collection('families').doc(userCredential.user.uid).set({
                name: email.split('@')[0],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                members: [{
                    email: email,
                    role: 'admin'
                }]
            });
        })
        .then(() => {
            alert('Family created successfully!');
            window.location.href = 'dashboard.html';
        })
        .catch(error => {
            alert('Error: ' + error.message);
        });
}

function loginFamily() {
    const email = document.getElementById('family-email').value;
    const password = document.getElementById('family-password').value;
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = 'dashboard.html';
        })
        .catch(error => {
            alert('Login failed: ' + error.message);
        });
}

// ===== FAMILY MANAGEMENT =====
function addMember() {
    const memberEmail = document.getElementById('member-email').value;
    const familyId = auth.currentUser.uid;
    
    if (!memberEmail) {
        alert('Please enter member email');
        return;
    }

    db.collection('families').doc(familyId).update({
        members: firebase.firestore.FieldValue.arrayUnion({
            email: memberEmail,
            role: 'member'
        })
    })
    .then(() => {
        alert('Member added successfully');
        document.getElementById('member-email').value = '';
        loadMembers();
    })
    .catch(error => {
        alert('Error adding member: ' + error.message);
    });
}

function loadMembers() {
    const familyId = auth.currentUser.uid;
    const membersList = document.getElementById('members-list');
    
    db.collection('families').doc(familyId).get()
        .then(doc => {
            membersList.innerHTML = '';
            doc.data().members.forEach(member => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${member.email}</span>
                    <span class="role">${member.role}</span>
                `;
                membersList.appendChild(li);
            });
        });
}

// ===== EXPENSE MANAGEMENT =====
function addExpense() {
    const name = document.getElementById('expense-name').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value || new Date().toISOString().split('T')[0];
    
    if (!name || isNaN(amount)) {
        alert('Please fill all fields correctly');
        return;
    }

    const expense = {
        familyId: auth.currentUser.uid,
        memberEmail: auth.currentUser.email,
        name: name,
        amount: amount,
        date: date,
        month: new Date(date).getMonth() + 1,
        year: new Date(date).getFullYear(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection('expenses').add(expense)
        .then(() => {
            alert('Expense added successfully');
            document.getElementById('expense-name').value = '';
            document.getElementById('expense-amount').value = '';
            loadExpenses();
        })
        .catch(error => {
            alert('Error adding expense: ' + error.message);
        });
}

function loadExpenses(timePeriod = 'month') {
    const familyId = auth.currentUser.uid;
    const memberEmail = auth.currentUser.email;
    let query = db.collection('expenses')
        .where('familyId', '==', familyId)
        .where('memberEmail', '==', memberEmail)
        .orderBy('date', 'desc');

    if (timePeriod !== 'all') {
        const today = new Date();
        const month = today.getMonth() + 1;
        const year = today.getFullYear();
        
        if (timePeriod === 'month') {
            query = query.where('month', '==', month)
                        .where('year', '==', year);
        } else if (timePeriod === 'year') {
            query = query.where('year', '==', year);
        }
    }

    query.get()
        .then(snapshot => {
            const expensesTable = document.getElementById('expenses-table').getElementsByTagName('tbody')[0];
            expensesTable.innerHTML = '';
            
            let monthTotal = 0;
            let yearTotal = 0;
            const currentYear = new Date().getFullYear();
            const currentMonth = new Date().getMonth() + 1;

            snapshot.forEach(doc => {
                const expense = doc.data();
                const row = expensesTable.insertRow();
                
                // Calculate totals
                if (expense.year === currentYear) {
                    yearTotal += expense.amount;
                    if (expense.month === currentMonth) {
                        monthTotal += expense.amount;
                    }
                }

                row.innerHTML = `
                    <td>${expense.date}</td>
                    <td>${expense.name}</td>
                    <td>₹${expense.amount.toFixed(2)}</td>
                    <td>
                        <button onclick="editExpense('${doc.id}')" class="edit-btn"><i class="fas fa-edit"></i></button>
                    </td>
                `;
            });

            // Update summary cards
            document.getElementById('month-total').textContent = `₹${monthTotal.toFixed(2)}`;
            document.getElementById('year-total').textContent = `₹${yearTotal.toFixed(2)}`;
        });
}

// ===== DATA MANAGEMENT =====
function resetFamilyData() {
    const familyId = auth.currentUser.uid;
    
    if (!confirm('This will delete ALL expenses and members. Continue?')) return;

    // Batch delete expenses
    db.collection('expenses').where('familyId', '==', familyId).get()
        .then(snapshot => {
            const batch = db.batch();
            snapshot.forEach(doc => {
                batch.delete(doc.ref);
            });
            return batch.commit();
        })
        .then(() => {
            // Reset members (keep only admin)
            return db.collection('families').doc(familyId).update({
                members: [{
                    email: auth.currentUser.email,
                    role: 'admin'
                }]
            });
        })
        .then(() => {
            alert('Family data reset successfully');
            hideResetModal();
            loadMembers();
            loadExpenses();
        })
        .catch(error => {
            alert('Error resetting data: ' + error.message);
        });
}

// ===== HELPER FUNCTIONS =====
function showResetModal() {
    document.getElementById('reset-modal').style.display = 'flex';
}

function hideResetModal() {
    document.getElementById('reset-modal').style.display = 'none';
}

function logout() {
    auth.signOut()
        .then(() => {
            window.location.href = 'index.html';
        });
}

// Initialize page based on user role
auth.onAuthStateChanged(user => {
    if (!user) {
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
        return;
    }

    // Check if user is admin or member
    db.collection('families').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                // User is family admin
                if (window.location.pathname.includes('member.html')) {
                    window.location.href = 'dashboard.html';
                }
                document.getElementById('family-name').textContent = doc.data().name;
                loadMembers();
                loadSummary();
            } else {
                // User is family member
                if (window.location.pathname.includes('dashboard.html')) {
                    window.location.href = 'member.html';
                }
                document.getElementById('member-name').textContent = user.email;
                loadExpenses();
            }
        });
});
