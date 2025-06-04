// Firebase Config (YOUR CONFIG)
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

// Auth Functions
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(error => {
      alert("Error: " + error.message);
    });
}

function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  if (!email || !password) {
    alert("Please fill all fields");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Account created! Please login.");
    })
    .catch(error => {
      alert("Error: " + error.message);
    });
}

function logout() {
  auth.signOut()
    .then(() => {
      window.location.href = "index.html";
    });
}

// Expense Functions
function addExpense() {
  const user = auth.currentUser;
  if (!user) return;

  const name = document.getElementById("expense-name").value;
  const amount = parseFloat(document.getElementById("expense-amount").value);

  if (!name || isNaN(amount)) {
    alert("Invalid input");
    return;
  }

  const date = new Date();
  db.collection("expenses").add({
    userId: user.uid,
    name: name,
    amount: amount,
    date: date,
    month: date.getMonth() + 1,
    year: date.getFullYear()
  })
  .then(() => {
    document.getElementById("expense-name").value = "";
    document.getElementById("expense-amount").value = "";
    loadExpenses();
  })
  .catch(error => {
    alert("Error: " + error.message);
  });
}

function loadExpenses() {
  const user = auth.currentUser;
  if (!user) return;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Monthly Total
  db.collection("expenses")
    .where("userId", "==", user.uid)
    .where("month", "==", currentMonth)
    .where("year", "==", currentYear)
    .get()
    .then(snapshot => {
      let total = 0;
      snapshot.forEach(doc => {
        total += doc.data().amount;
      });
      document.getElementById("monthly-total").textContent = "₹" + total.toFixed(2);
    });

  // Yearly Total
  db.collection("expenses")
    .where("userId", "==", user.uid)
    .where("year", "==", currentYear)
    .get()
    .then(snapshot => {
      let total = 0;
      snapshot.forEach(doc => {
        total += doc.data().amount;
      });
      document.getElementById("yearly-total").textContent = "₹" + total.toFixed(2);
    });
}

// Auto-check auth state
auth.onAuthStateChanged(user => {
  if (window.location.pathname.includes("dashboard.html")) {
    if (user) {
      loadExpenses();
    } else {
      window.location.href = "index.html";
    }
  }
});