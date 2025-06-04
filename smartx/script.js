// Firebase Config (YOUR CONFIG INTEGRATED)
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
function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  if (!email || !password) {
    alert("Please fill in all fields");
    return;
  }

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      window.location.href = "dashboard.html";
    })
    .catch(error => {
      alert("Login failed: " + error.message);
    });
}

function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  if (!email || !password) {
    alert("Please fill in all fields");
    return;
  }

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Account created! Please login.");
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
    })
    .catch(error => {
      alert("Signup failed: " + error.message);
    });
}

function logout() {
  auth.signOut()
    .then(() => {
      window.location.href = "index.html";
    })
    .catch(error => {
      alert("Logout error: " + error.message);
    });
}

// ===== EXPENSE FUNCTIONS =====
function addExpense() {
  const user = auth.currentUser;
  if (!user) {
    alert("Please login first");
    return;
  }

  const name = document.getElementById("expense-name").value;
  const amount = parseFloat(document.getElementById("expense-amount").value);

  if (!name || isNaN(amount) || amount <= 0) {
    alert("Please enter valid expense details");
    return;
  }

  const date = new Date();
  
  // Show loading state
  const button = document.querySelector(".add-expense button");
  const originalText = button.innerHTML;
  button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
  button.disabled = true;

  db.collection("expenses").add({
    userId: user.uid,
    name: name,
    amount: amount,
    date: date,
    month: date.getMonth() + 1,
    year: date.getFullYear()
  })
  .then(() => {
    // Clear form
    document.getElementById("expense-name").value = "";
    document.getElementById("expense-amount").value = "";
    
    // Reload expenses
    loadExpenses();
  })
  .catch(error => {
    alert("Error adding expense: " + error.message);
  })
  .finally(() => {
    // Reset button
    button.innerHTML = originalText;
    button.disabled = false;
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
      let monthlyTotal = 0;
      snapshot.forEach(doc => {
        monthlyTotal += doc.data().amount;
      });
      document.getElementById("monthly-total").textContent = "₹" + monthlyTotal.toFixed(2);
    });

  // Yearly Total
  db.collection("expenses")
    .where("userId", "==", user.uid)
    .where("year", "==", currentYear)
    .get()
    .then(snapshot => {
      let yearlyTotal = 0;
      snapshot.forEach(doc => {
        yearlyTotal += doc.data().amount;
      });
      document.getElementById("yearly-total").textContent = "₹" + yearlyTotal.toFixed(2);
    });

  // Recent Expenses (Last 10)
  const expensesList = document.getElementById("expenses");
  expensesList.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>Loading expenses...</p></div>';

  db.collection("expenses")
    .where("userId", "==", user.uid)
    .orderBy("date", "desc")
    .limit(10)
    .get()
    .then(snapshot => {
      if (snapshot.empty) {
        expensesList.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No expenses added yet</p></div>';
        return;
      }

      expensesList.innerHTML = "";
      snapshot.forEach(doc => {
        const expense = doc.data();
        const expenseItem = document.createElement("div");
        expenseItem.className = "expense-item";
        expenseItem.innerHTML = `
          <span class="expense-name">${expense.name}</span>
          <span class="expense-amount">₹${expense.amount.toFixed(2)}</span>
        `;
        expensesList.appendChild(expenseItem);
      });
    });
}

// ===== AUTO-RUN =====
auth.onAuthStateChanged(user => {
  if (window.location.pathname.includes("dashboard.html")) {
    if (user) {
      loadExpenses();
    } else {
      window.location.href = "index.html";
    }
  }
});