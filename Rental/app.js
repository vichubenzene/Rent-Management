// Load tenants from localStorage
const loadTenants = () => {
    const data = localStorage.getItem('tenants');
    return data ? JSON.parse(data) : {};
};

// Save tenants to localStorage
const saveTenants = (tenants) => {
    localStorage.setItem('tenants', JSON.stringify(tenants));
};

// Initial load
let tenants = loadTenants();

function addTenant() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const lastRentDate = document.getElementById('lastRentDate').value;

    if (!name || !phone) {
        alert('Please fill out all fields.');
        return;
    }

    tenants[name] = {
        phone,
        lastRentDate: lastRentDate ? new Date(lastRentDate).toISOString() : null,
        rentDue: 0, // Initialize rent due
        lastRentIncrementDate: null, // Initialize rent increment date
        payments: [] // Initialize payments array
    };

    saveTenants(tenants);
    alert('Tenant added successfully.');
    updateRentDue(name);
}

function updateRentDue(name) {
    const tenant = tenants[name];
    if (!tenant) return;

    const today = new Date();
    const lastRentDate = tenant.lastRentDate ? new Date(tenant.lastRentDate) : today;

    // Calculate days since last rent
    const daysDiff = Math.floor((today - lastRentDate) / (1000 * 60 * 60 * 24));
    const gracePeriod = 10;
    const overdueDays = Math.max(0, daysDiff - gracePeriod);

    // Update rent due
    tenant.rentDue = overdueDays * 100; // Assuming rent per day is 100, adjust as needed

    saveTenants(tenants);
}

function payRent() {
    const name = document.getElementById('payName').value;
    const amount = parseFloat(document.getElementById('payAmount').value);
    const datePaid = document.getElementById('payDate').value;

    if (!tenants[name]) {
        alert('Tenant not found.');
        return;
    }

    if (isNaN(amount) || !datePaid) {
        alert('Please provide valid payment details.');
        return;
    }

    const tenant = tenants[name];
    tenant.payments.push({
        amount,
        datePaid: new Date(datePaid).toISOString()
    });

    tenant.rentDue -= amount;
    if (tenant.rentDue < 0) tenant.rentDue = 0;

    saveTenants(tenants);
    alert('Rent payment recorded successfully.');
}

function incrementRent() {
    const name = document.getElementById('incrementName').value;
    const incrementAmount = parseFloat(document.getElementById('incrementAmount').value);

    if (!tenants[name]) {
        alert('Tenant not found.');
        return;
    }

    if (isNaN(incrementAmount)) {
        alert('Please provide a valid increment amount.');
        return;
    }

    const tenant = tenants[name];
    tenant.rentDue += incrementAmount;
    tenant.lastRentIncrementDate = new Date().toISOString();

    saveTenants(tenants);
    alert('Rent increment recorded successfully.');
}

function checkPendingRent() {
    const name = document.getElementById('checkName').value;
    const result = document.getElementById('rentResult');

    if (!tenants[name]) {
        result.innerText = 'Tenant not found.';
        return;
    }

    const tenant = tenants[name];
    const today = new Date();
    const lastRentDate = tenant.lastRentDate ? new Date(tenant.lastRentDate) : today;

    if (!tenant.rentDue) {
        result.innerText = 'No rent due.';
        return;
    }

    const timeDiff = today - lastRentDate;
    const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    
    result.innerText = `Pending Rent: ${tenant.rentDue} (Due for ${daysDiff} days)`;
}

function updateRent() {
    const name = document.getElementById('updateName').value;
    const updateDate = document.getElementById('updateDate').value;

    if (!tenants[name]) {
        alert('Tenant not found.');
        return;
    }

    if (!updateDate) {
        alert('Please provide a new rent date.');
        return;
    }

    tenants[name].lastRentDate = new Date(updateDate).toISOString();
    updateRentDue(name);
    saveTenants(tenants);
    alert('Rent date updated successfully.');
}

function viewProfile() {
    const name = document.getElementById('profileName').value;
    const result = document.getElementById('profileResult');

    if (!tenants[name]) {
        result.innerText = 'Tenant not found.';
        return;
    }

    const tenant = tenants[name];
    const lastIncrementDate = tenant.lastRentIncrementDate ? new Date(tenant.lastRentIncrementDate).toDateString() : 'N/A';
    result.innerText = `Name: ${name}\nPhone: ${tenant.phone}\nLast Rent Date: ${tenant.lastRentDate ? new Date(tenant.lastRentDate).toDateString() : 'N/A'}\nLast Rent Increment Date: ${lastIncrementDate}\nRent Due: ${tenant.rentDue}`;
}

// Export to CSV
function exportCSV() {
    const csvRows = [];
    const headers = ['Name', 'Phone', 'Last Rent Date', 'Rent Due', 'Last Rent Increment Date', 'Payments'];
    csvRows.push(headers.join(','));

    for (const [name, tenant] of Object.entries(tenants)) {
        const payments = tenant.payments.map(p => `${p.amount} (${new Date(p.datePaid).toLocaleDateString()})`).join('; ');
        const row = [
            name,
            tenant.phone,
            tenant.lastRentDate ? new Date(tenant.lastRentDate).toLocaleDateString() : '',
            tenant.rentDue,
            tenant.lastRentIncrementDate ? new Date(tenant.lastRentIncrementDate).toLocaleDateString() : '',
            payments
        ];
        csvRows.push(row.join(','));
    }

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tenants.csv';
    a.click();
    URL.revokeObjectURL(url);
}

// Import from CSV
function importCSV() {
    const fileInput = document.getElementById('importFile');
    if (!fileInput.files.length) {
        alert('Please select a file to import.');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const text = event.target.result;
        const rows = text.split('\n');
        const newTenants = {};

        rows.slice(1).forEach(row => {
            const [name, phone, lastRentDate, rentDue, lastIncrementDate, payments] = row.split(',');
            if (name) {
                newTenants[name] = {
                    phone,
                    lastRentDate: lastRentDate ? new Date(lastRentDate).toISOString() : null,
                    rentDue: parseFloat(rentDue) || 0,
                    lastRentIncrementDate: lastIncrementDate ? new Date(lastIncrementDate).toISOString() : null,
                    payments: payments ? payments.split('; ').map(p => {
                        const [amount, datePaid] = p.split(' (');
                        return { amount: parseFloat(amount), datePaid: new Date(datePaid.replace(')', '')).toISOString() };
                    }) : []
                };
            }
        });

        tenants = newTenants;
        saveTenants(tenants);
        alert('Data imported successfully.');
    };

    reader.readAsText(file);
}

// Calculate and display pending rent
function displayPendingRent() {
    const result = document.getElementById('rentResult');
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const gracePeriod = 10; // Days of grace period

    const sortedTenants = Object.entries(tenants)
        .map(([name, tenant]) => {
            const lastRentDate = tenant.lastRentDate ? new Date(tenant.lastRentDate) : null;
            return { name, lastRentDate };
        })
        .filter(tenant => tenant.lastRentDate)
        .sort((a, b) => new Date(b.lastRentDate) - new Date(a.lastRentDate));

    let output = '';
    sortedTenants.forEach(({ name, lastRentDate }) => {
        const lastRentMonthStart = new Date(lastRentDate.getFullYear(), lastRentDate.getMonth(), 1);
        const daysSinceLastRent = Math.floor((today - lastRentDate) / (1000 * 60 * 60 * 24));
        const graceDays = Math.max(0, gracePeriod - (today.getDate() - 1)); // Calculate remaining grace days
        const overdueDays = daysSinceLastRent - graceDays;

        if (overdueDays > 0) {
            output += `Tenant: ${name}, Overdue Days: ${overdueDays}\n`;
        }
    });

    result.innerText = output || 'No pending rent.';
}

// Bind displayPendingRent function to an HTML element if needed
document.addEventListener('DOMContentLoaded', () => {
    // Automatically display pending rent when the page loads
    displayPendingRent();
});
