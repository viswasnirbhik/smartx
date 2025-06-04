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

// ===== CORE FUNCTIONS =====

// 1. Family Authentication
function createFamily() {
    const familyName = document.getElementById('family-name').value;
    const password = document.getElementById('password').value;
    const familyEmail = `${familyName.toLowerCase().replace(/\s+/g, '')}@smartx.family`;

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
            alert(`Family "${familyName}" created!`);
            window.location.href = 'dashboard.html';
        })
        .catch(error => alert(error.message));
}

function loginFamily() {
    const familyName = document.getElementById('family-name').value;
    const password = document.getElementById('password').value;
    const familyEmail = `${familyName.toLowerCase().replace(/\s+/g, '')}@smartx.family`;

    auth.signInWithEmailAndPassword(familyEmail, password)
        .then(() => {
            window.location.href = 'dashboard.html';
        })
        .catch(error => alert(error.message));
}

// 2. Member Management
function addMember() {
    const email = document.getElementById('member-email').value;
    const password = document.getElementById('member-password').value;
    const familyId = auth.currentUser.uid;

    // Create member account
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            // Add to family members list
            return db.collection('families').doc(familyId).update({
                members: firebase.firestore.FieldValue.arrayUnion({
                    email: email,
                    role: 'member'
                })
            });
        })
        .then(() => {
            alert('Member added successfully!');
            document.getElementById('member-email').value = '';
            document.getElementById('member-password').value = '';
        })
        .catch(error => alert(error.message));
}

function loginMember() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = 'member.html';
        })
        .catch(error => alert(error.message));
}

// 3. Expense Management
function addExpense() {
    const name = document.getElementById('expense-name').value;
    const amount = parseFloat(document.getElementById('expense-amount').value);
    const date = document.getElementById('expense-date').value || new Date().toISOString().split('T')[0];
    const familyId = auth.currentUser.uid;

    db.collection('expenses').add({
        familyId: familyId,
        memberEmail: auth.currentUser.email,
        name: name,
        amount: amount,
        date: date,
        month: new Date(date).getMonth() + 1,
        year: new Date(date).getFullYear(),
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        alert('Expense added!');
        document.getElementById('expense-name').value = '';
        document.getElementById('expense-amount').value = '';
        loadMyExpenses();
    })
    .catch(error => alert(error.message));
}

// 4. Data Loading
function loadFamilyData() {
    const familyId = auth.currentUser.uid;
    
    // Load family name
    db.collection('families').doc(familyId).get()
        .then(doc => {
            document.getElementById('family-name').textContent = doc.data().name;
        });

    // Load expenses
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // Monthly total
    db.collection('expenses')
        .where('familyId', '==', familyId)
        .where('month', '==', currentMonth)
        .where('year', '==', currentYear)
        .get()
        .then(snapshot => {
            let total = 0;
            snapshot.forEach(doc => total += doc.data().amount);
            document.getElementById('month-t
