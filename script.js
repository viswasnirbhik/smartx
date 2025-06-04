// script.js

// Your Firebase config (replace with yours later)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let familyID = '';
let memberName = '';

function loginFamily() {
  familyID = document.getElementById('familyId').value.trim();
  if (familyID) {
    document.getElementById('memberAuth').style.display = 'block';
  }
}

function loginMember() {
  memberName = document.getElementById('memberName').value.trim();
  if (memberName) {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('currentMember').textContent = memberName;
    loadExpenses();
  }
}

function addExpense() {
  const name = document.getElementById('expenseName').value;
  const amount = parseFloat(document.getElementById('expenseAmount').value);
  if (!name || !amount) return;

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const time = now.toISOString();

  const ref = db.ref(`families/${familyID}/expenses`);
  ref.push({
    name,
    amount,
    member: memberName,
    month,
    year,
    time
  });

  document.getElementById('expenseName').value = '';
  document.getElementById('expenseAmount').value = '';
  setTimeout(loadExpenses, 1000);
}

function loadExpenses() {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  db.ref(`families/${familyID}/expenses`).once('value', snapshot => {
    const expenses = snapshot.val();
    let monthlyTotal = 0;
    let yearlyTotal = 0;
    let memberTotal = 0;
    let historyHtml = '';

    for (let key in expenses) {
      const exp = expenses[key];
      if (exp.year == currentYear) {
        yearlyTotal += exp.amount;
        if (exp.month == currentMonth) {
          monthlyTotal += exp.amount;
        }
      }
      if (exp.member === memberName) memberTotal += exp.amount;

      historyHtml += `<p>${exp.time.split('T')[0]} - ${exp.member}: ₹${exp.amount} for ${exp.name}</p>`;
    }

    document.getElementById('monthlyTotal').textContent = monthlyTotal.toFixed(2);
    document.getElementById('yearlyTotal').textContent = yearlyTotal.toFixed(2);
    document.getElementById('memberTotal').textContent = memberTotal.toFixed(2);
    document.getElementById('history').innerHTML = historyHtml;
  });
}
