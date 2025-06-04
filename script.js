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
    
    auth.createUserWithEmailAndPassword(`${familyName}@smartx.family`, password)
        .then(userCred => {
            return db.collection('families').doc(userCred.user.uid).set({
                name: familyName,
                members: [{
                    email: `${familyName}@smartx.family`,
                    role: 'admin'
                }]
            });
        })
        .then(() => {
            alert('Family created! Use your family name to login.');
        })
        .catch(err => alert(err.message));
}

function loginFamily() {
    const familyName = document.getElementById('family-name').value;
    const password = document.getElementById('family-password').value;
    
    auth.signInWithEmailAndPassword(`${familyName}@smartx.family`, password)
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

// ===== MEMBER FUNCTIONS =====
function addMember() {
    const email = document.getElementById('member-email').value;
    const familyId = auth.currentUser.uid;
    
    db.collection('families').doc(familyId).update({
        members: firebase.firestore.FieldValue.arrayUnion({
            email: email,
            role: 'member'
        })
    }).then(() => {
        alert('Member added! They can now login with their email.');
    });
}

// ===== EXPENSE FUNCTIONS =====
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
    });
}

function resetData() {
    if (!confirm('Delete ALL expenses and members?')) return;
    
    const familyId = auth.currentUser.uid;
    
    // Delete expenses
    db.collection('expenses').where('familyId', '==', familyId).get()
        .then(snap => {
            const batch = db.batch();
            snap.forEach(doc => batch.delete(doc.ref));
            return batch.commit();
        })
        .then(() => {
            // Reset members
            return db.collection('families').doc(familyId).update({
                members: [{
                    email: auth.currentUser.email,
                    role: 'admin'
                }]
            });
        })
        .then(() => {
            alert('Data reset complete');
            location.reload();
        });
}

// ===== INITIALIZE =====
auth.onAuthStateChanged(user => {
    if (!user) {
        if (!window.location.pathname.includes('index.html')) {
            window.location.href = 'index.html';
        }
        return;
    }
    
    // Check if admin or member
    db.collection('families').doc(user.uid).get()
        .then(doc => {
            if (doc.exists) {
                // Admin view
                document.getElementById('family-display').textContent = doc.data().name;
                if (window.location.pathname.includes('member.html')) {
                    window.location.href = 'dashboard.html';
                }
                loadExpenses();
            } else {
                // Member view
                document.getElementById('member-display').textContent = user.email;
                if (window.location.pathname.includes('dashboard.html')) {
                    window.location.href = 'member.html';
                }
                loadMyExpenses();
            }
        });
});
