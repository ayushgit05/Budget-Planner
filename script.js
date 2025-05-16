// Initialize variables
let expenses = JSON.parse(localStorage.getItem("expenses")) || {};
let totalIncome = parseFloat(localStorage.getItem("income")) || 0;
let totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
let warningIssued = false;
let chartInstance = null; // Store chart instance to prevent duplication

// Function to add an expense
function addExpense() {
    const incomeInput = document.getElementById("income");
    totalIncome = parseFloat(incomeInput.value) || 0;
    localStorage.setItem("income", totalIncome);

    const expenseInput = document.getElementById("expense");
    const categoryInput = document.getElementById("category");

    let expenseAmount = parseFloat(expenseInput.value) || 0;
    let category = categoryInput.value.trim();

    if (totalIncome <= 0) {
        alert("🚨 Please enter a valid income greater than 0.");
        return;
    }

    if (expenseAmount <= 0) {
        alert("🚨 Expense must be greater than 0.");
        return;
    }

    // Check if 90% of salary is spent
    if (totalExpenses + expenseAmount > totalIncome * 0.9) {
        if (!warningIssued) {
            let reason = "⚠ You cannot add further expenses because you have already spent a lot.";
            alert(reason);
            document.getElementById("warning-message").textContent = reason;
            document.getElementById("warning-message").style.color = "red";
            console.warn(reason);
            warningIssued = true;
        }
        return;
    }

    // Store expense in local storage
    if (!expenses[category]) {
        expenses[category] = 0;
    }
    expenses[category] += expenseAmount;
    totalExpenses += expenseAmount;

    localStorage.setItem("expenses", JSON.stringify(expenses));
    expenseInput.value = "";

    // Update UI
    loadExpenses();
    analyzeBudget();
}

// Function to analyze budget
function analyzeBudget() {
    let remainingBalance = totalIncome - totalExpenses;
    let budgetMsg = document.getElementById("budget-analysis");

    if (remainingBalance > totalIncome * 0.5) {
        budgetMsg.textContent = "✅ Great! You are saving well.";
        budgetMsg.style.color = "green";
    } else if (remainingBalance > totalIncome * 0.2) {
        budgetMsg.textContent = "⚠ Be careful! Try to limit extra expenses.";
        budgetMsg.style.color = "orange";
    } else {
        budgetMsg.textContent = "❌ Warning! You are overspending.";
        budgetMsg.style.color = "red";
    }
}

// Function to load expenses into the table
function loadExpenses() {
    let expenseTableBody = document.getElementById("expense-table-body");

    if (expenseTableBody) {
        expenseTableBody.innerHTML = "";

        for (let category in expenses) {
            let row = `<tr><td>${category}</td><td>₹${expenses[category]}</td></tr>`;
            expenseTableBody.innerHTML += row;
        }
    }

    updateTotals(); // Ensure total expenses are updated
    drawChart(); // Refresh the pie chart
}

// Function to draw Pie Chart
function drawChart() {
    let chartCanvas = document.getElementById("expenseChart");

    // 🚨 Ensure the canvas exists
    if (!chartCanvas) {
        console.error("🚨 Pie chart canvas not found in analysis.html!");
        return;
    }

    // Get 2D context correctly
    let ctx = chartCanvas.getContext("2d");

    // 🚨 Ensure there are expenses to display
    if (Object.keys(expenses).length === 0) {
        console.warn("⚠ No expenses available to display in the chart.");
        return; // Don't draw an empty chart
    }

    // Destroy previous chart instance if it exists
    if (chartInstance) {
        chartInstance.destroy();
    }

    // Create new Pie Chart
    chartInstance = new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(expenses),
            datasets: [{
                data: Object.values(expenses),
                backgroundColor: ["#ff6384", "#36a2eb", "#ffce56", "#4bc0c0", "#9966ff"],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    console.log("✅ Pie chart updated successfully!");
}

// Function to update total expenses and savings
function updateTotals() {
    totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);

    let expenseElement = document.getElementById("total-expense");
    let savingsElement = document.getElementById("total-savings");

    if (expenseElement) {
        expenseElement.textContent = `Total Expense: ₹${totalExpenses}`;
    }

    if (savingsElement) {
        let totalSavings = totalIncome - totalExpenses;
        savingsElement.textContent = `Total Savings: ₹${totalSavings}`;
    }
}

// Function to go to analysis page
function goToAnalysis() {
    window.location.href = "analysis.html";
}

// Function to go back to input page
function goBack() {
    window.location.href = "index.html";
}

// Function to reset budget
function resetBudget() {
    localStorage.removeItem("expenses");
    localStorage.removeItem("income");
    expenses = {};
    totalIncome = 0;
    totalExpenses = 0;

    document.getElementById("expense-table-body").innerHTML = "";
    document.getElementById("income").value = "";
    document.getElementById("expense").value = "";
    document.getElementById("budget-analysis").textContent = "Waiting for input...";
    document.getElementById("warning-message").textContent = "";
}

// Ensure data loads when the page loads
document.addEventListener("DOMContentLoaded", () => {
    expenses = JSON.parse(localStorage.getItem("expenses")) || {};
    totalIncome = parseFloat(localStorage.getItem("income")) || 0;
    
    if (window.location.pathname.includes("analysis.html")) {
        loadExpenses(); // Load expenses in analysis page
    } else {
        loadExpenses();
        analyzeBudget();
    }
});

// Function to Export Data to Excel
function exportToExcel() {
    if (Object.keys(expenses).length === 0) {
        alert("No expenses to export!");
        return;
    }

    // Prepare data array with headers
    let expenseArray = [
        ["Category", "Amount (₹)"]
    ];

    for (let category in expenses) {
        expenseArray.push([category, expenses[category]]);
    }

    // Convert array to Excel sheet
    let ws = XLSX.utils.aoa_to_sheet(expenseArray);
    let wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Budget Data");

    // Download Excel file
    XLSX.writeFile(wb, "Budget_Report.xlsx");
}
