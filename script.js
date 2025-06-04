// Firebase Config
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

// ===== AUTH FUNCTIONS =====
function createFamily() {
    const familyName = document.getElementById('family-name').value;
    const password = document.getElementById('family-password').value;
    const familyEmail = `${familyName.replace(/\s+/g, '').toLowerCase()}@smartx.family`;

    auth.createUserWithEmailAndPassword(familyEmail, password)
        .then(userCred => {
            return db.collection('families').doc(userCred.user.uid).set({
                name: familyName,
                members: [{
                    email: familyEmail,
                    role: 'admin'
                }]
            });
        })
        .then(() => {
            alert(`Family "${familyName}" created! Use this name to login.`);
        })
        .catch(err => alert(err.message));
}

function loginFamily() {
    const familyName = document.getElementById('family-name').value;
    const password = document.getElementById('family-password').value;
    const familyEmail = `${familyName.replace(/\s+/g, '').toLowerCase()}@smartx.family`;

    auth.signInWithEmailAndPassword(familyEmail, password)
        .then(() => {
            window.location.href = 'dashboard.html';
        })
        .catch(err => alert(err.message));
}

function logout() {
    auth.signOut().then(() => {
        window.location.href = 'index.html';
    });
}

// ===== MEMBER MANAGEMENT =====
function addMember() {
    const email = document.getElementById('member-email').value;
    const password = document.getElementById('member-password').value;
    const familyId = auth.currentUser.uid;

    // 1. Create member account
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            // 2. Add to family members list
            return db.collection('families').doc(familyId).update({
                members: firebase.firestore.FieldValue.arrayUnion({
                    email: email,
                    role: 'member'
                })
            });
        })
        .then(() => {
            alert(`Member ${email} added! They can now login.`);
            document.getElementById('member-email').value = '';
            document.getElementById('member-password').value = '';
            loadMembers();
        })
        .catch(err => alert(err.message));
}

function loadMembers() {
    const familyId = auth.currentUser.uid;
    db.collection('families').doc(familyId).get()
        .then(doc => {
            const membersList = document.getElementById('members-list');
            membersList.innerHTML = '';
            doc.data().members.forEach(member => {
                const li = document.createElement('li');
                li.textContent = `${member.email} (${member.role})`;
                membersList.appendChild(li);
            });
        });
}

// ===== EXPENSE MANAGEMENT =====
function addExpense() {
    const name = document.getElementById('expense-name').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value || new Date().toISOString().split('T')[0];

    db.collection('expenses').add({
        familyId: auth.currentUser.uid,
        memberEmail: auth.currentUser.email,
        name: name,
        amount: amount,
        date: date,
        month: new Date(date).getMonth() + 1,
        year: new Date(date).getFullYear(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert('Expense added!');
        document.getElementById('expense-name').value = '';
        document.getElementById('expense-amount').value = '';
        filterExpenses();
    });
}

function filterExpenses() {
    const monthInput = document.getElementById('filter-month').value;
    const [year, month] = monthInput.split('-');
    const familyId = auth.currentUser.uid;
    const memberEmail = auth.currentUser.email;

    let query = db.collection('expenses')
        .where('familyId', '==', familyId)
        .where('memberEmail', '==', memberEmail)
        .orderBy('timestamp', 'desc');

    if (monthInput) {
        query = query.where('year', '==', parseInt(year))
                    .where('month', '==', parseInt(month));
    }

    query.get().then(snapshot => {
        const table = document.getElementById('my-expenses').getElementsByTagName('tbody')[0];
        table.innerHTML = '';
        let total = 0;

        snapshot.forEach(doc => {
            const expense = doc.data();
            total += expense.amount;
            const row = table.insertRow();
            row.innerHTML = `
                <td>${expense.date}</td>
                <td>${expense.name}</td>
                <td>₹${expense.amount.toFixed(2)}</td>
                <td><button onclick="deleteExpense('${doc.id}')">Delete</button></td>
            `;
        });

        if (snapshot.empty) {
            table.innerHTML = '<tr><td colspan="4">No expenses found</td></tr>';
        }
    });
}

function deleteExpense(expenseId) {
    if (confirm('Delete this expense?')) {
        db.collection('expenses').doc(expenseId).delete()
            .then(() => filterExpenses());
    }
}

// ===== INITIALIZE =====
auth.onAuthStateChanged(user => {
    if (!user) {
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
        return;
    }

    // Check if user is admin or member
    db.collection('families').where('members', 'array-contains', {email: user.email}).get()
        .then(snapshot => {
            if (snapshot.empty) return;

            const familyData = snapshot.docs[0].data();
            const isAdmin = familyData.members.some(m => m.email === user.email && m.role === 'admin');

            if (isAdmin) {
                // Admin view
                document.getElementById('family-display').textContent = familyData.name;
                if (!window.location.pathname.includes('dashboard.html')) {
                    window.location.href = 'dashboard.html';
                }
                loadMembers();
            } else {
                // Member view
                document.getElementById('member-display').textContent = user.email;
                if (!window.location.pathname.includes('member.html')) {
                    window.location.href = 'member.html';
                }
                filterExpenses();
            }
        });
});
