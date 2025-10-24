// Bank Tycoon Game - Main Game Logic

class BankGame {
    constructor() {
        // Financial State
        this.cashReserves = 1000;
        this.customerDeposits = 0;
        this.investments = {
            bonds: 0,
            stocks: 0,
            speculative: 0
        };
        this.totalProfit = 0;

        // Customer State
        this.activeAccounts = 0;
        this.customerTrust = 100;
        this.customerQueue = [];

        // Loan System
        this.loans = []; // Active loans
        this.loanQueue = []; // Pending loan requests
        this.totalLoansIssued = 0;
        this.totalLoanDefaults = 0;
        this.loanIdCounter = 0;

        // Staff Management
        this.staff = {
            tellers: 0,     // Handle more customer transactions
            guards: 0,      // Increase security
            managers: 0,    // Reduce operating costs
            loanOfficers: 0 // Increase loan capacity
        };
        this.bankLevel = 1; // Bank size/upgrade level
        this.maxStaff = { tellers: 2, guards: 1, managers: 0, loanOfficers: 0 }; // Max staff at current level

        // Staff Automation Settings
        this.automation = {
            tellers: {
                autoApproveDeposits: true,
                autoApproveWithdrawals: true,
                maxWithdrawalAmount: 200,
                minReserveRatioForWithdrawals: 30 // % - won't approve if reserves drop below this
            },
            loanOfficers: {
                autoApproveLowRisk: true,
                autoApproveMediumRisk: false,
                autoApproveHighRisk: false,
                maxLoanAmount: 5000,
                minCashBuffer: 1.5 // Multiplier - need this much cash vs loan amount
            },
            managers: {
                autoInvest: false,
                autoInvestThreshold: 2000, // Only invest if cash above this
                autoInvestPercentage: 10, // % of excess cash to invest
                preferredInvestment: 'bonds', // 'bonds', 'stocks', 'speculative'
                autoUpgradeTech: false,
                autoHireStaff: false
            }
        };
        this.showAutomationPanel = false;

        // Time and Era
        this.currentYear = 1920;
        this.currentMonth = 1;
        this.currentDay = 1;
        this.daysInMonth = 30;
        this.monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        this.era = this.getEra();
        this.autoAdvance = true; // Start with auto-advance ON
        this.autoInterval = null;
        this.timeSpeed = 20000; // milliseconds per day (20s normal, 30s slow, 10s fast)
        this.dayProgress = 0; // Progress towards next day (0-100)
        this.dayProgressInterval = null;

        // Teller Capacity System
        this.dailyTellerCapacity = 0; // Set based on staff
        this.dailyTellerUsed = 0; // Customers served today

        // Technology
        this.technologies = {
            security: [
                { id: 'vault1', name: 'Reinforced Vault', cost: 500, level: 0, protection: 20, maxLevel: 3, desc: 'Better vault protection' },
                { id: 'guards', name: 'Security Guards', cost: 800, level: 0, protection: 30, maxLevel: 3, desc: 'Hire security personnel' },
                { id: 'alarm', name: 'Alarm System', cost: 1500, level: 0, protection: 40, maxLevel: 2, desc: 'Alert system for threats' },
                { id: 'cameras', name: 'Security Cameras', cost: 3000, level: 0, protection: 50, maxLevel: 2, minYear: 1950, desc: 'Video surveillance' },
                { id: 'biometric', name: 'Biometric Access', cost: 8000, level: 0, protection: 70, maxLevel: 2, minYear: 1990, desc: 'Fingerprint/retina scans' },
                { id: 'cyber', name: 'Cybersecurity', cost: 12000, level: 0, protection: 80, maxLevel: 3, minYear: 2000, desc: 'Digital protection' }
            ],
            profit: [
                { id: 'accounting', name: 'Better Accounting', cost: 400, level: 0, bonus: 0.05, maxLevel: 3, desc: '+5% profit per level' },
                { id: 'marketing', name: 'Marketing Campaign', cost: 600, level: 0, bonus: 0.08, maxLevel: 3, desc: '+8% profit per level' },
                { id: 'automation', name: 'Office Automation', cost: 2000, level: 0, bonus: 0.15, maxLevel: 2, minYear: 1960, desc: '+15% profit per level' },
                { id: 'digital', name: 'Digital Banking', cost: 5000, level: 0, bonus: 0.25, maxLevel: 2, minYear: 1990, desc: '+25% profit per level' },
                { id: 'trading', name: 'Algorithmic Trading', cost: 8000, level: 0, bonus: 0.20, maxLevel: 2, minYear: 2000, desc: '+20% profit per level' },
                { id: 'blockchain', name: 'Blockchain Integration', cost: 15000, level: 0, bonus: 0.30, maxLevel: 2, minYear: 2010, desc: '+30% profit per level' }
            ],
            customer: [
                { id: 'service', name: 'Customer Service', cost: 300, level: 0, benefit: 2, maxLevel: 5, desc: '+2% trust recovery per level' },
                { id: 'rewards', name: 'Rewards Program', cost: 800, level: 0, benefit: 0.5, maxLevel: 3, desc: '+0.5 customers/month per level' },
                { id: 'branches', name: 'New Branches', cost: 2000, level: 0, benefit: 1, maxLevel: 3, minYear: 1940, desc: '+1 customer/month per level' },
                { id: 'atm', name: 'ATM Network', cost: 4000, level: 0, benefit: 2, maxLevel: 2, minYear: 1970, desc: '+2 customers/month per level' },
                { id: 'mobile', name: 'Mobile Banking', cost: 7000, level: 0, benefit: 3, maxLevel: 2, minYear: 2000, desc: '+3 customers/month per level' },
                { id: 'social', name: 'Social Media Presence', cost: 5000, level: 0, benefit: 5, maxLevel: 2, minYear: 2010, desc: '+5% trust recovery per level' }
            ],
            efficiency: [
                { id: 'training', name: 'Staff Training', cost: 500, level: 0, benefit: 0.02, maxLevel: 3, desc: '-2% operating costs per level' },
                { id: 'systems', name: 'Better Systems', cost: 1200, level: 0, benefit: 0.03, maxLevel: 3, minYear: 1950, desc: '-3% costs per level' },
                { id: 'ai', name: 'AI Assistant', cost: 6000, level: 0, benefit: 0.05, maxLevel: 2, minYear: 2000, desc: '-5% costs per level' },
                { id: 'cloud', name: 'Cloud Infrastructure', cost: 10000, level: 0, benefit: 0.04, maxLevel: 2, minYear: 2010, desc: '-4% costs per level' },
                { id: 'ml', name: 'Machine Learning', cost: 18000, level: 0, benefit: 0.06, maxLevel: 2, minYear: 2015, desc: '-6% costs + predictions' }
            ]
        };

        // Game Stats
        this.securityLevel = this.calculateSecurityLevel();
        this.profitMultiplier = this.calculateProfitMultiplier();

        // Events
        this.eventLog = [];
        this.lastThiefAttempt = 0;

        // Statistics Tracking
        this.statistics = {
            history: {
                cash: [],           // {month, year, value}
                deposits: [],       // {month, year, value}
                profit: [],         // {month, year, value}
                accounts: []        // {month, year, value}
            },
            totals: {
                customersServed: 0,
                depositsProcessed: 0,
                withdrawalsProcessed: 0,
                robberiesPrevented: 0,
                robberiesSucceeded: 0
            }
        };
        this.showStatistics = false;

        // Objectives System
        this.objectives = [
            { id: 'cash_5k', name: 'Reach $5,000 cash', target: 5000, type: 'cash', completed: false, reward: 500 },
            { id: 'cash_10k', name: 'Reach $10,000 cash', target: 10000, type: 'cash', completed: false, reward: 1000 },
            { id: 'cash_50k', name: 'Reach $50,000 cash', target: 50000, type: 'cash', completed: false, reward: 5000 },
            { id: 'year_1930', name: 'Survive until 1930', target: 1930, type: 'year', completed: false, reward: 2000 },
            { id: 'year_1950', name: 'Survive until 1950', target: 1950, type: 'year', completed: false, reward: 5000 },
            { id: 'year_1970', name: 'Survive until 1970', target: 1970, type: 'year', completed: false, reward: 10000 },
            { id: 'profit_10k', name: 'Earn $10,000 total profit', target: 10000, type: 'profit', completed: false, reward: 2000 },
            { id: 'profit_50k', name: 'Earn $50,000 total profit', target: 50000, type: 'profit', completed: false, reward: 10000 },
            { id: 'accounts_50', name: 'Reach 50 active accounts', target: 50, type: 'accounts', completed: false, reward: 1000 },
            { id: 'accounts_100', name: 'Reach 100 active accounts', target: 100, type: 'accounts', completed: false, reward: 3000 },
            { id: 'trust_100', name: 'Maintain 100% trust for 1 year', target: 12, type: 'trust', completed: false, reward: 2000, counter: 0 },
            { id: 'security_max', name: 'Max out all security tech', target: 1, type: 'security', completed: false, reward: 5000 },
            { id: 'profit_max', name: 'Max out all profit tech', target: 1, type: 'profit_tech', completed: false, reward: 5000 }
        ];

        this.init();
    }

    init() {
        this.updateDisplay();
        this.renderTechTree();
        this.checkAutoSave();
        this.startAutoAdvance(); // Start time progression automatically
    }

    // Save/Load System
    saveGame() {
        const saveData = {
            version: '1.2',
            timestamp: Date.now(),
            cashReserves: this.cashReserves,
            customerDeposits: this.customerDeposits,
            investments: {...this.investments},
            totalProfit: this.totalProfit,
            activeAccounts: this.activeAccounts,
            customerTrust: this.customerTrust,
            currentYear: this.currentYear,
            currentMonth: this.currentMonth,
            technologies: {
                security: this.technologies.security.map(t => ({ id: t.id, level: t.level })),
                profit: this.technologies.profit.map(t => ({ id: t.id, level: t.level }))
            },
            lastThiefAttempt: this.lastThiefAttempt
        };

        try {
            localStorage.setItem('bankTycoonSave', JSON.stringify(saveData));
            this.addEvent('💾 Game saved successfully!', 'success');
            this.updateSaveInfo();
            return true;
        } catch (error) {
            this.addEvent('Failed to save game: ' + error.message, 'danger');
            return false;
        }
    }

    loadGame() {
        try {
            const saveData = localStorage.getItem('bankTycoonSave');
            if (!saveData) {
                this.addEvent('No saved game found', 'warning');
                return false;
            }

            const data = JSON.parse(saveData);

            // Restore financial state
            this.cashReserves = data.cashReserves;
            this.customerDeposits = data.customerDeposits;
            this.investments = {...data.investments};
            this.totalProfit = data.totalProfit;

            // Restore customer state
            this.activeAccounts = data.activeAccounts;
            this.customerTrust = data.customerTrust;

            // Restore time
            this.currentYear = data.currentYear;
            this.currentMonth = data.currentMonth;
            this.era = this.getEra();

            // Restore technology levels
            data.technologies.security.forEach(saved => {
                const tech = this.technologies.security.find(t => t.id === saved.id);
                if (tech) tech.level = saved.level;
            });
            data.technologies.profit.forEach(saved => {
                const tech = this.technologies.profit.find(t => t.id === saved.id);
                if (tech) tech.level = saved.level;
            });

            this.lastThiefAttempt = data.lastThiefAttempt || 0;

            // Recalculate derived values
            this.securityLevel = this.calculateSecurityLevel();
            this.profitMultiplier = this.calculateProfitMultiplier();

            // Update display
            this.renderTechTree();
            this.updateDisplay();
            this.addEvent('💾 Game loaded successfully!', 'success');
            this.updateSaveInfo();
            return true;
        } catch (error) {
            this.addEvent('Failed to load game: ' + error.message, 'danger');
            return false;
        }
    }

    deleteSave() {
        if (confirm('Are you sure you want to delete your saved game? This cannot be undone!')) {
            localStorage.removeItem('bankTycoonSave');
            this.addEvent('💾 Save deleted', 'warning');
            this.updateSaveInfo();
        }
    }

    exportSave() {
        const saveData = localStorage.getItem('bankTycoonSave');
        if (!saveData) {
            this.addEvent('No saved game to export', 'warning');
            return;
        }

        // Create a downloadable file
        const blob = new Blob([saveData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bank-tycoon-save-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.addEvent('💾 Save exported successfully!', 'success');
    }

    importSave() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';

        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const saveData = event.target.result;
                    // Validate it's valid JSON
                    JSON.parse(saveData);

                    localStorage.setItem('bankTycoonSave', saveData);
                    this.loadGame();
                    this.addEvent('💾 Save imported and loaded!', 'success');
                } catch (error) {
                    this.addEvent('Failed to import save: Invalid file', 'danger');
                }
            };
            reader.readAsText(file);
        };

        input.click();
    }

    newGame() {
        if (confirm('Start a new game? Your current progress will be lost unless saved!')) {
            localStorage.removeItem('bankTycoonSave');
            location.reload();
        }
    }

    checkAutoSave() {
        const saveData = localStorage.getItem('bankTycoonSave');
        if (saveData) {
            const data = JSON.parse(saveData);
            const saveDate = new Date(data.timestamp);
            const hasSave = confirm(
                `Found a saved game from ${saveDate.toLocaleString()}\n` +
                `Year: ${data.currentYear}, Cash: $${Math.floor(data.cashReserves)}\n\n` +
                `Load this save?`
            );

            if (hasSave) {
                this.loadGame();
            }
        }
        this.updateSaveInfo();
    }

    updateSaveInfo() {
        const saveInfo = document.getElementById('saveInfo');
        if (!saveInfo) return;

        const saveData = localStorage.getItem('bankTycoonSave');
        if (saveData) {
            const data = JSON.parse(saveData);
            const saveDate = new Date(data.timestamp);
            saveInfo.innerHTML = `
                <div class="save-exists">
                    💾 Last Save: ${saveDate.toLocaleDateString()} ${saveDate.toLocaleTimeString()}<br>
                    Year: ${data.currentYear} | Cash: $${Math.floor(data.cashReserves)}
                </div>
            `;
        } else {
            saveInfo.innerHTML = '<div class="no-save">No saved game</div>';
        }
    }

    // Era System
    getEra() {
        if (this.currentYear < 1930) return { name: '1920s - The Roaring Twenties', id: 'roaring20s' };
        if (this.currentYear < 1940) return { name: '1930s - The Great Depression', id: 'depression' };
        if (this.currentYear < 1950) return { name: '1940s - War Economy', id: 'wartime' };
        if (this.currentYear < 1970) return { name: '1950s-60s - Post-War Boom', id: 'postwar' };
        if (this.currentYear < 1990) return { name: '1970s-80s - Modern Banking', id: 'modern' };
        if (this.currentYear < 2010) return { name: '1990s-2000s - Digital Revolution', id: 'digital' };
        if (this.currentYear < 2030) return { name: '2010s-20s - FinTech Era', id: 'fintech' };
        return { name: '2030s+ - Future Banking', id: 'future' };
    }

    // Time Management
    advanceTime() {
        this.currentDay++;

        // Reset teller capacity for new day
        this.dailyTellerUsed = 0;
        this.dailyTellerCapacity = this.staff.tellers * 10; // Each teller can serve 10 customers/day

        if (this.currentDay > this.daysInMonth) {
            this.currentDay = 1;
            this.currentMonth++;

            if (this.currentMonth > 12) {
                this.currentMonth = 1;
                this.currentYear++;
                this.era = this.getEra();
                this.renderTechTree(); // Update available tech
                // Auto-save every year
                this.saveGame();
            }

            // Record historical data each month
            this.recordHistoricalData();

            // Process monthly events
            this.processLoans();
            this.processInvestments();
            this.processManagerAutomation(); // Manager automated tasks
            this.processThiefEvents();
            this.processWages();
            this.checkObjectives();
        }

        // Generate 2-6 customers per day + customer tech bonuses
        const baseCustomers = Math.floor(Math.random() * 5) + 2;
        const bonusCustomers = Math.floor(this.getCustomerBonus());
        const customerCount = baseCustomers + bonusCustomers;

        for (let i = 0; i < customerCount; i++) {
            this.generateCustomer();
        }

        // Generate loan requests (1-2 per day, 10% chance)
        if (Math.random() < 0.1) {
            const loanCount = Math.floor(Math.random() * 2) + 1;
            for (let i = 0; i < loanCount; i++) {
                this.generateLoanRequest();
            }
        }

        // Daily trust recovery
        this.processCustomerEvents();

        // Reset day progress
        this.dayProgress = 0;

        this.updateDisplay();
    }

    startAutoAdvance() {
        if (this.autoAdvance && !this.autoInterval) {
            this.autoInterval = setInterval(() => this.advanceTime(), this.timeSpeed);
            this.startProgressBar();
            const btn = document.getElementById('autoBtn');
            if (btn) {
                btn.textContent = 'Pause';
                btn.classList.add('active');
            }
        }
    }

    toggleAutoPause() {
        this.autoAdvance = !this.autoAdvance;
        const btn = document.getElementById('autoBtn');

        if (this.autoAdvance) {
            btn.textContent = 'Pause';
            btn.classList.add('active');
            this.autoInterval = setInterval(() => this.advanceTime(), this.timeSpeed);
            this.startProgressBar();
        } else {
            btn.textContent = 'Play';
            btn.classList.remove('active');
            clearInterval(this.autoInterval);
            this.autoInterval = null;
            this.stopProgressBar();
        }
    }

    startProgressBar() {
        this.stopProgressBar(); // Clear any existing interval
        this.dayProgress = 0;

        // Update progress bar 20 times per second for smooth animation
        this.dayProgressInterval = setInterval(() => {
            this.dayProgress += (100 / (this.timeSpeed / 50)); // Increment based on time speed
            if (this.dayProgress > 100) this.dayProgress = 100;

            const progressBar = document.getElementById('dayProgressBar');
            if (progressBar) {
                progressBar.style.width = `${this.dayProgress}%`;
            }
        }, 50);
    }

    stopProgressBar() {
        if (this.dayProgressInterval) {
            clearInterval(this.dayProgressInterval);
            this.dayProgressInterval = null;
        }
    }

    toggleAutomationPanel() {
        this.showAutomationPanel = !this.showAutomationPanel;
        const panel = document.getElementById('automationPanel');
        const btn = document.getElementById('toggleAutomationBtn');

        if (this.showAutomationPanel) {
            panel.style.display = 'block';
            btn.classList.add('active');
            this.renderAutomationPanel();
        } else {
            panel.style.display = 'none';
            btn.classList.remove('active');
        }
    }

    updateAutomationSetting(category, setting, value) {
        // Parse value appropriately
        if (typeof this.automation[category][setting] === 'boolean') {
            this.automation[category][setting] = value;
        } else if (typeof this.automation[category][setting] === 'number') {
            this.automation[category][setting] = parseFloat(value);
        } else {
            this.automation[category][setting] = value;
        }

        this.addEvent(`Updated ${category} automation: ${setting}`, 'info');
    }

    renderAutomationPanel() {
        // This will populate the automation panel with current settings
        // Update all checkbox and input values to match current automation settings

        // Tellers
        document.getElementById('autoApproveDeposits').checked = this.automation.tellers.autoApproveDeposits;
        document.getElementById('autoApproveWithdrawals').checked = this.automation.tellers.autoApproveWithdrawals;
        document.getElementById('maxWithdrawalAmount').value = this.automation.tellers.maxWithdrawalAmount;
        document.getElementById('maxWithdrawalDisplay').textContent = `$${this.automation.tellers.maxWithdrawalAmount}`;
        document.getElementById('minReserveRatio').value = this.automation.tellers.minReserveRatioForWithdrawals;
        document.getElementById('minReserveDisplay').textContent = `${this.automation.tellers.minReserveRatioForWithdrawals}%`;

        // Loan Officers
        document.getElementById('autoApproveLowRisk').checked = this.automation.loanOfficers.autoApproveLowRisk;
        document.getElementById('autoApproveMediumRisk').checked = this.automation.loanOfficers.autoApproveMediumRisk;
        document.getElementById('autoApproveHighRisk').checked = this.automation.loanOfficers.autoApproveHighRisk;
        document.getElementById('maxLoanAmount').value = this.automation.loanOfficers.maxLoanAmount;
        document.getElementById('maxLoanDisplay').textContent = `$${this.automation.loanOfficers.maxLoanAmount}`;
        document.getElementById('minCashBuffer').value = this.automation.loanOfficers.minCashBuffer;
        document.getElementById('minCashBufferDisplay').textContent = `${this.automation.loanOfficers.minCashBuffer}x`;

        // Managers
        document.getElementById('autoInvest').checked = this.automation.managers.autoInvest;
        document.getElementById('autoInvestThreshold').value = this.automation.managers.autoInvestThreshold;
        document.getElementById('autoInvestThresholdDisplay').textContent = `$${this.automation.managers.autoInvestThreshold}`;
        document.getElementById('autoInvestPercentage').value = this.automation.managers.autoInvestPercentage;
        document.getElementById('autoInvestPercentageDisplay').textContent = `${this.automation.managers.autoInvestPercentage}%`;
        document.getElementById('preferredInvestment').value = this.automation.managers.preferredInvestment;
        document.getElementById('autoUpgradeTech').checked = this.automation.managers.autoUpgradeTech;
        document.getElementById('autoHireStaff').checked = this.automation.managers.autoHireStaff;
    }

    changeSpeed(speed) {
        this.timeSpeed = speed;
        if (this.autoInterval) {
            clearInterval(this.autoInterval);
            this.autoInterval = setInterval(() => this.advanceTime(), this.timeSpeed);
            this.startProgressBar(); // Restart progress bar with new speed
        }

        // Update button states
        document.querySelectorAll('.speed-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');

        const speedName = speed === 10000 ? 'Fast' : speed === 20000 ? 'Normal' : 'Slow';
        this.addEvent(`Speed changed to ${speedName} (${speed/1000}s per day)`, 'info');
    }

    // Customer Management

    generateCustomer() {
        const types = ['deposit', 'deposit', 'deposit', 'withdrawal']; // More deposits than withdrawals
        const type = types[Math.floor(Math.random() * types.length)];

        let amount;
        let canAutoApprove = this.dailyTellerUsed < this.dailyTellerCapacity;

        if (type === 'deposit') {
            amount = Math.floor(Math.random() * 500 + 100);

            // Auto-approve deposits if setting is on AND teller capacity available
            if (this.automation.tellers.autoApproveDeposits && canAutoApprove) {
                this.cashReserves += amount;
                this.customerDeposits += amount;
                this.activeAccounts++;
                this.dailyTellerUsed++;
                this.statistics.totals.customersServed++;
                this.statistics.totals.depositsProcessed++;
                return; // Don't display, just process
            }
        } else {
            // Can only withdraw if there are deposits
            if (this.customerDeposits <= 0) return;
            amount = Math.floor(Math.random() * Math.min(300, this.customerDeposits));

            // Auto-approve small withdrawals if settings allow AND teller capacity available
            const reserveRatioAfter = ((this.cashReserves - amount) / this.customerDeposits) * 100;
            const isWithinAmountLimit = amount <= this.automation.tellers.maxWithdrawalAmount;
            const hasGoodReserves = reserveRatioAfter >= this.automation.tellers.minReserveRatioForWithdrawals;

            if (this.automation.tellers.autoApproveWithdrawals &&
                isWithinAmountLimit &&
                hasGoodReserves &&
                this.cashReserves >= amount &&
                canAutoApprove) {
                // Auto-approve small, safe withdrawals
                this.cashReserves -= amount;
                this.customerDeposits -= amount;
                this.dailyTellerUsed++;
                this.statistics.totals.customersServed++;
                this.statistics.totals.withdrawalsProcessed++;
                return; // Don't display, just process
            }
        }

        // If we reach here, customer needs manual approval (either risky or no teller capacity)
        const customer = {
            type: type,
            amount: amount,
            id: Date.now() + Math.random(), // Ensure unique IDs
            reason: !canAutoApprove ? 'No teller capacity' : type === 'deposit' ? 'Manual approval required' : 'Large/risky withdrawal'
        };

        this.customerQueue.push(customer);
        this.displayCustomer(customer);
    }

    displayCustomer(customer) {
        const queueDiv = document.getElementById('customerQueue');

        // Clear hint if present
        if (queueDiv.querySelector('.hint')) {
            queueDiv.innerHTML = '';
        }

        const customerDiv = document.createElement('div');
        customerDiv.className = 'customer-request';
        customerDiv.id = `customer-${customer.id}`;

        const icon = customer.type === 'deposit' ? '💰' : '💵';
        const action = customer.type === 'deposit' ? 'Deposit' : 'Withdraw';

        customerDiv.innerHTML = `
            <div class="customer-info">
                <span>${icon} ${action}: $${customer.amount}</span>
                ${customer.reason ? `<div class="customer-reason">${customer.reason}</div>` : ''}
            </div>
            <div class="customer-actions">
                <button onclick="game.handleCustomer(${customer.id}, true)" class="approve-btn">✓ Approve</button>
                <button onclick="game.handleCustomer(${customer.id}, false)" class="deny-btn">✗ Deny</button>
            </div>
        `;

        queueDiv.appendChild(customerDiv);

        // Auto-deny after 8 seconds (faster pace now)
        setTimeout(() => {
            const elem = document.getElementById(`customer-${customer.id}`);
            if (elem) {
                this.handleCustomer(customer.id, false);
            }
        }, 8000);
    }

    handleCustomer(customerId, approve) {
        const customerIndex = this.customerQueue.findIndex(c => c.id === customerId);
        if (customerIndex === -1) return;

        const customer = this.customerQueue[customerIndex];
        const customerDiv = document.getElementById(`customer-${customerId}`);

        if (approve) {
            if (customer.type === 'deposit') {
                this.cashReserves += customer.amount;
                this.customerDeposits += customer.amount;
                this.activeAccounts++;
                this.statistics.totals.customersServed++;
                this.statistics.totals.depositsProcessed++;
                this.addEvent(`✓ Accepted deposit of $${customer.amount}`, 'success');
            } else { // withdrawal
                if (this.cashReserves >= customer.amount) {
                    this.cashReserves -= customer.amount;
                    this.customerDeposits -= customer.amount;
                    this.statistics.totals.customersServed++;
                    this.statistics.totals.withdrawalsProcessed++;
                    this.addEvent(`✓ Processed withdrawal of $${customer.amount}`, 'success');
                } else {
                    this.customerTrust = Math.max(0, this.customerTrust - 10);
                    this.addEvent(`✗ Failed withdrawal! Insufficient reserves. Trust decreased!`, 'danger');
                }
            }
        } else {
            if (customer.type === 'withdrawal') {
                this.customerTrust = Math.max(0, this.customerTrust - 5);
            }
            this.statistics.totals.customersServed++;
            this.addEvent(`Denied customer request for $${customer.amount}`, 'warning');
        }

        this.customerQueue.splice(customerIndex, 1);
        if (customerDiv) customerDiv.remove();
        this.updateDisplay();
    }

    // Loan System
    generateLoanRequest() {
        // Loan purposes with different risk profiles
        const loanTypes = [
            { purpose: 'Home Purchase', risk: 'low', baseAmount: 5000, interestRate: 0.05 },
            { purpose: 'Business Startup', risk: 'high', baseAmount: 3000, interestRate: 0.12 },
            { purpose: 'Education', risk: 'low', baseAmount: 2000, interestRate: 0.04 },
            { purpose: 'Car Purchase', risk: 'medium', baseAmount: 1500, interestRate: 0.07 },
            { purpose: 'Home Renovation', risk: 'medium', baseAmount: 2500, interestRate: 0.06 },
            { purpose: 'Business Expansion', risk: 'medium', baseAmount: 4000, interestRate: 0.08 },
            { purpose: 'Debt Consolidation', risk: 'high', baseAmount: 3500, interestRate: 0.10 },
            { purpose: 'Medical Expenses', risk: 'medium', baseAmount: 1000, interestRate: 0.07 },
            { purpose: 'Speculative Investment', risk: 'high', baseAmount: 2000, interestRate: 0.15 }
        ];

        const loanType = loanTypes[Math.floor(Math.random() * loanTypes.length)];
        const amount = Math.floor(loanType.baseAmount * (0.7 + Math.random() * 0.6)); // ±30% variance
        const termMonths = [12, 24, 36, 48, 60][Math.floor(Math.random() * 5)];

        // Calculate default probability based on risk
        let defaultProbability;
        switch (loanType.risk) {
            case 'low': defaultProbability = 0.02; break; // 2% chance per year
            case 'medium': defaultProbability = 0.05; break; // 5% chance per year
            case 'high': defaultProbability = 0.10; break; // 10% chance per year
        }

        const loanRequest = {
            id: this.loanIdCounter++,
            purpose: loanType.purpose,
            amount: amount,
            interestRate: loanType.interestRate,
            termMonths: termMonths,
            risk: loanType.risk,
            defaultProbability: defaultProbability / 12, // Convert to monthly
            requestDate: `${this.monthNames[this.currentMonth - 1]} ${this.currentYear}`
        };

        // Auto-approve loans based on automation settings
        const hasLoanOfficers = this.staff.loanOfficers > 0;
        const hasEnoughCash = this.cashReserves >= amount * this.automation.loanOfficers.minCashBuffer;
        const isWithinAmountLimit = amount <= this.automation.loanOfficers.maxLoanAmount;

        let shouldAutoApprove = false;
        if (hasLoanOfficers && hasEnoughCash && isWithinAmountLimit) {
            if (loanType.risk === 'low' && this.automation.loanOfficers.autoApproveLowRisk) {
                shouldAutoApprove = true;
            } else if (loanType.risk === 'medium' && this.automation.loanOfficers.autoApproveMediumRisk) {
                shouldAutoApprove = true;
            } else if (loanType.risk === 'high' && this.automation.loanOfficers.autoApproveHighRisk) {
                shouldAutoApprove = true;
            }
        }

        if (shouldAutoApprove) {
            // Auto-approve the loan
            this.cashReserves -= amount;
            const monthlyPayment = this.calculateLoanPayment(amount, loanType.interestRate, termMonths);

            const activeLoan = {
                ...loanRequest,
                monthlyPayment: monthlyPayment,
                remainingPayments: termMonths,
                principalRemaining: amount,
                totalPaid: 0,
                issueDate: `${this.monthNames[this.currentMonth - 1]} ${this.currentYear}`
            };

            this.loans.push(activeLoan);
            this.totalLoansIssued++;
            this.customerTrust = Math.min(100, this.customerTrust + 1);
            return; // Don't display, just process
        }

        this.loanQueue.push(loanRequest);
        this.displayLoanRequest(loanRequest);
    }

    displayLoanRequest(loan) {
        const queueDiv = document.getElementById('loanQueue');
        if (!queueDiv) return;

        const loanDiv = document.createElement('div');
        loanDiv.className = `loan-request risk-${loan.risk}`;
        loanDiv.id = `loan-${loan.id}`;

        const monthlyPayment = this.calculateLoanPayment(loan.amount, loan.interestRate, loan.termMonths);
        const totalRepayment = monthlyPayment * loan.termMonths;
        const totalInterest = totalRepayment - loan.amount;

        const riskColor = { low: '#44ff44', medium: '#ffaa00', high: '#ff4444' };

        loanDiv.innerHTML = `
            <div class="loan-header">
                <span class="loan-purpose">${loan.purpose}</span>
                <span class="loan-risk" style="color: ${riskColor[loan.risk]}">${loan.risk.toUpperCase()} RISK</span>
            </div>
            <div class="loan-details">
                <div>Amount: $${loan.amount}</div>
                <div>Interest: ${(loan.interestRate * 100).toFixed(1)}% APR</div>
                <div>Term: ${loan.termMonths} months</div>
                <div>Monthly Payment: $${Math.floor(monthlyPayment)}</div>
                <div>Total Interest: $${Math.floor(totalInterest)}</div>
            </div>
            <div class="loan-actions">
                <button onclick="game.handleLoan(${loan.id}, true)" class="approve-btn">✓ Approve Loan</button>
                <button onclick="game.handleLoan(${loan.id}, false)" class="deny-btn">✗ Deny</button>
            </div>
        `;

        queueDiv.appendChild(loanDiv);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            const elem = document.getElementById(`loan-${loan.id}`);
            if (elem) {
                this.handleLoan(loan.id, false);
            }
        }, 10000);
    }

    calculateLoanPayment(principal, annualRate, months) {
        const monthlyRate = annualRate / 12;
        if (monthlyRate === 0) return principal / months;
        return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
               (Math.pow(1 + monthlyRate, months) - 1);
    }

    handleLoan(loanId, approve) {
        const loanIndex = this.loanQueue.findIndex(l => l.id === loanId);
        if (loanIndex === -1) return;

        const loan = this.loanQueue[loanIndex];
        const loanDiv = document.getElementById(`loan-${loanId}`);

        if (approve) {
            if (this.cashReserves < loan.amount) {
                this.addEvent(`Cannot approve loan: insufficient cash reserves`, 'danger');
                this.customerTrust = Math.max(0, this.customerTrust - 3);
            } else {
                // Issue the loan
                this.cashReserves -= loan.amount;
                const monthlyPayment = this.calculateLoanPayment(loan.amount, loan.interestRate, loan.termMonths);

                const activeLoan = {
                    ...loan,
                    monthlyPayment: monthlyPayment,
                    remainingPayments: loan.termMonths,
                    principalRemaining: loan.amount,
                    totalPaid: 0,
                    issueDate: `${this.monthNames[this.currentMonth - 1]} ${this.currentYear}`
                };

                this.loans.push(activeLoan);
                this.totalLoansIssued++;
                this.customerTrust = Math.min(100, this.customerTrust + 2);
                this.addEvent(`✓ Approved ${loan.purpose} loan: $${loan.amount} @ ${(loan.interestRate * 100).toFixed(1)}%`, 'success');
            }
        } else {
            this.addEvent(`Denied loan request for ${loan.purpose}`, 'info');
        }

        this.loanQueue.splice(loanIndex, 1);
        if (loanDiv) loanDiv.remove();
        this.updateDisplay();
    }

    processLoans() {
        const loansToRemove = [];

        this.loans.forEach((loan, index) => {
            // Check for default
            if (Math.random() < loan.defaultProbability) {
                // Loan defaults!
                this.totalLoanDefaults++;
                this.customerTrust = Math.max(0, this.customerTrust - 5);
                this.addEvent(`💥 LOAN DEFAULT: ${loan.purpose} ($${Math.floor(loan.principalRemaining)} lost)`, 'danger');
                loansToRemove.push(index);
                return;
            }

            // Process monthly payment
            this.cashReserves += loan.monthlyPayment;
            loan.totalPaid += loan.monthlyPayment;
            loan.remainingPayments--;

            const interestPortion = (loan.principalRemaining * loan.interestRate / 12);
            const principalPortion = loan.monthlyPayment - interestPortion;
            loan.principalRemaining -= principalPortion;

            this.totalProfit += interestPortion;

            // Check if loan is paid off
            if (loan.remainingPayments <= 0) {
                const totalInterest = loan.totalPaid - loan.amount;
                this.addEvent(`✓ Loan paid off: ${loan.purpose} (+$${Math.floor(totalInterest)} interest)`, 'success');
                loansToRemove.push(index);
            }
        });

        // Remove completed/defaulted loans (reverse order to maintain indices)
        loansToRemove.reverse().forEach(index => {
            this.loans.splice(index, 1);
        });
    }

    updateLoanDisplay() {
        const container = document.getElementById('activeLoansList');
        if (!container) return;

        if (this.loans.length === 0) {
            container.innerHTML = '<div class="no-loans">No active loans</div>';
            return;
        }

        container.innerHTML = '';

        this.loans.forEach(loan => {
            const div = document.createElement('div');
            div.className = `active-loan risk-${loan.risk}`;

            const percentPaid = ((loan.termMonths - loan.remainingPayments) / loan.termMonths) * 100;

            div.innerHTML = `
                <div class="loan-title">${loan.purpose} - $${Math.floor(loan.principalRemaining)}</div>
                <div class="loan-progress-bar">
                    <div class="loan-progress-fill" style="width: ${percentPaid}%"></div>
                </div>
                <div class="loan-info">
                    ${loan.remainingPayments} payments left | $${Math.floor(loan.monthlyPayment)}/mo
                </div>
            `;

            container.appendChild(div);
        });
    }

    // Staff Management System
    getStaffWages() {
        const wages = {
            tellers: 50,      // $50/month per teller
            guards: 80,       // $80/month per guard
            managers: 120,    // $120/month per manager
            loanOfficers: 100 // $100/month per loan officer
        };

        let totalWages = 0;
        for (let role in this.staff) {
            totalWages += this.staff[role] * wages[role];
        }
        return totalWages;
    }

    hireStaff(role) {
        const wages = {
            tellers: 50,
            guards: 80,
            managers: 120,
            loanOfficers: 100
        };

        if (this.staff[role] >= this.maxStaff[role]) {
            this.addEvent(`Cannot hire more ${role} - upgrade bank first!`, 'warning');
            return;
        }

        const wage = wages[role];
        if (this.cashReserves < wage * 3) { // Require 3 months wages upfront
            this.addEvent(`Need $${wage * 3} to hire ${role} (3 months wages)`, 'danger');
            return;
        }

        this.staff[role]++;
        this.cashReserves -= wage * 3;
        this.addEvent(`✓ Hired ${role.slice(0, -1)}: +$${wage}/month wage`, 'success');
        this.updateDisplay();
    }

    fireStaff(role) {
        if (this.staff[role] <= 0) {
            this.addEvent(`No ${role} to fire`, 'warning');
            return;
        }

        this.staff[role]--;
        this.customerTrust = Math.max(0, this.customerTrust - 3); // Firing damages morale
        this.addEvent(`Fired ${role.slice(0, -1)} - trust decreased`, 'warning');
        this.updateDisplay();
    }

    upgradeBank() {
        const upgradeCosts = [0, 2000, 5000, 10000, 20000, 40000]; // Costs for levels 1-6
        const nextLevel = this.bankLevel + 1;

        if (nextLevel > 5) {
            this.addEvent(`Bank is already at maximum level!`, 'warning');
            return;
        }

        const cost = upgradeCosts[nextLevel];
        if (this.cashReserves < cost) {
            this.addEvent(`Need $${cost} to upgrade to Level ${nextLevel}`, 'danger');
            return;
        }

        this.cashReserves -= cost;
        this.bankLevel = nextLevel;

        // Increase staff capacity
        this.maxStaff = {
            tellers: 2 + (nextLevel - 1) * 2,      // 2, 4, 6, 8, 10
            guards: 1 + Math.floor((nextLevel - 1) / 2), // 1, 1, 2, 2, 3
            managers: Math.max(0, nextLevel - 2),  // 0, 0, 1, 2, 3
            loanOfficers: Math.max(0, nextLevel - 2) // 0, 0, 1, 2, 3
        };

        this.addEvent(`🏛️ Bank upgraded to Level ${nextLevel}! Staff capacity increased`, 'success');
        this.updateDisplay();
    }

    processWages() {
        const wages = this.getStaffWages();
        if (wages > 0) {
            if (this.cashReserves >= wages) {
                this.cashReserves -= wages;
                if (wages > 100) { // Only log if significant
                    this.addEvent(`Paid staff wages: -$${wages}`, 'info');
                }
            } else {
                // Can't pay wages! Staff quit and trust drops
                const shortage = wages - this.cashReserves;
                this.cashReserves = 0;
                this.customerTrust = Math.max(0, this.customerTrust - 15);

                // Some staff quit
                if (this.staff.loanOfficers > 0) this.staff.loanOfficers = Math.max(0, this.staff.loanOfficers - 1);
                else if (this.staff.managers > 0) this.staff.managers = Math.max(0, this.staff.managers - 1);
                else if (this.staff.tellers > 0) this.staff.tellers = Math.max(0, this.staff.tellers - 1);

                this.addEvent(`💥 WAGE CRISIS: Couldn't pay $${shortage}! Staff quit, trust plummeted!`, 'danger');
            }
        }
    }

    getStaffBonuses() {
        return {
            customerBonus: this.staff.tellers * 0.5, // +0.5 customers per teller
            securityBonus: this.staff.guards * 25,   // +25 security per guard
            costReduction: this.staff.managers * 0.05, // -5% costs per manager
            loanCapacity: this.staff.loanOfficers * 2  // +2 max loans per officer
        };
    }

    updateStaffDisplay() {
        const container = document.getElementById('staffList');
        if (!container) return;

        const wages = { tellers: 50, guards: 80, managers: 120, loanOfficers: 100 };
        const names = {
            tellers: 'Tellers',
            guards: 'Security Guards',
            managers: 'Managers',
            loanOfficers: 'Loan Officers'
        };

        container.innerHTML = '';

        Object.keys(this.staff).forEach(role => {
            const div = document.createElement('div');
            div.className = 'staff-item';

            const current = this.staff[role];
            const max = this.maxStaff[role];
            const wage = wages[role];

            div.innerHTML = `
                <div class="staff-header">
                    <span class="staff-name">${names[role]}</span>
                    <span class="staff-count">${current}/${max}</span>
                </div>
                <div class="staff-info">
                    Wage: $${wage}/month each | Total: $${wage * current}/month
                </div>
                <div class="staff-actions">
                    <button onclick="game.hireStaff('${role}')" ${current >= max ? 'disabled' : ''}>
                        Hire ($${wage * 3})
                    </button>
                    <button onclick="game.fireStaff('${role}')" ${current <= 0 ? 'disabled' : ''} class="fire-btn">
                        Fire
                    </button>
                </div>
            `;

            container.appendChild(div);
        });

        // Add bank upgrade button
        const upgradeDiv = document.createElement('div');
        upgradeDiv.className = 'bank-upgrade';
        const nextLevel = this.bankLevel + 1;
        const costs = [0, 2000, 5000, 10000, 20000, 40000];
        const cost = costs[nextLevel] || 0;

        upgradeDiv.innerHTML = `
            <h3>Bank Level: ${this.bankLevel}/5</h3>
            <button onclick="game.upgradeBank()" ${nextLevel > 5 ? 'disabled' : ''}>
                ${nextLevel > 5 ? 'MAX LEVEL' : `Upgrade Bank ($${cost})`}
            </button>
        `;

        container.appendChild(upgradeDiv);
    }

    // Investment Management
    invest(type) {
        const inputId = type + 'Amount';
        const amount = parseInt(document.getElementById(inputId).value);

        if (!amount || amount <= 0) {
            this.addEvent('Invalid investment amount', 'warning');
            return;
        }

        if (amount > this.cashReserves) {
            this.addEvent('Insufficient cash reserves for investment', 'danger');
            return;
        }

        this.cashReserves -= amount;
        this.investments[type] += amount;
        this.addEvent(`Invested $${amount} in ${type}`, 'success');

        document.getElementById(inputId).value = '';
        this.updateDisplay();
    }

    processInvestments() {
        const returns = {
            bonds: 0.03 / 12, // 3% annual = 0.25% monthly
            stocks: 0.08 / 12,
            speculative: 0.15 / 12
        };

        let totalReturns = 0;

        for (let type in this.investments) {
            if (this.investments[type] > 0) {
                let returnAmount = this.investments[type] * returns[type];

                // Apply profit multiplier from tech
                returnAmount *= this.profitMultiplier;

                // Add some randomness (especially for speculative)
                if (type === 'speculative') {
                    const variance = (Math.random() - 0.5) * 0.4; // -20% to +20%
                    returnAmount *= (1 + variance);
                }

                this.cashReserves += returnAmount;
                totalReturns += returnAmount;
                this.totalProfit += returnAmount;
            }
        }

        if (totalReturns > 10) {
            this.addEvent(`Investment returns: +$${Math.floor(totalReturns)}`, 'success');
        }
    }

    processManagerAutomation() {
        if (this.staff.managers <= 0) return; // Need managers for automation

        const settings = this.automation.managers;

        // Auto-invest excess cash
        if (settings.autoInvest && this.cashReserves > settings.autoInvestThreshold) {
            const excessCash = this.cashReserves - settings.autoInvestThreshold;
            const investAmount = Math.floor(excessCash * (settings.autoInvestPercentage / 100));

            if (investAmount > 0) {
                this.cashReserves -= investAmount;
                this.investments[settings.preferredInvestment] += investAmount;
                this.addEvent(`Managers auto-invested $${investAmount} in ${settings.preferredInvestment}`, 'info');
            }
        }

        // Auto-upgrade tech (cheapest available)
        if (settings.autoUpgradeTech) {
            let cheapestTech = null;
            let cheapestCost = Infinity;
            let cheapestCategory = null;

            for (let category in this.technologies) {
                this.technologies[category].forEach(tech => {
                    if (tech.minYear && this.currentYear < tech.minYear) return;
                    if (tech.level >= tech.maxLevel) return;

                    const cost = tech.cost * (tech.level + 1);
                    if (cost < cheapestCost && this.cashReserves >= cost) {
                        cheapestTech = tech;
                        cheapestCost = cost;
                        cheapestCategory = category;
                    }
                });
            }

            if (cheapestTech && this.cashReserves >= cheapestCost * 2) { // Keep safety buffer
                this.researchTech(cheapestCategory, cheapestTech.id);
            }
        }

        // Auto-hire staff (when capacity allows and affordable)
        if (settings.autoHireStaff) {
            const wages = { tellers: 50, guards: 80, managers: 120, loanOfficers: 100 };

            for (let role in this.staff) {
                if (this.staff[role] < this.maxStaff[role]) {
                    const wage = wages[role];
                    const hireCost = wage * 3;

                    // Only hire if we have plenty of cash
                    if (this.cashReserves >= hireCost * 5) { // 5x buffer
                        this.staff[role]++;
                        this.cashReserves -= hireCost;
                        this.addEvent(`Managers auto-hired ${role.slice(0, -1)}`, 'info');
                        break; // Only hire one staff per month
                    }
                }
            }
        }
    }

    // Technology System
    calculateSecurityLevel() {
        let protection = 0;
        this.technologies.security.forEach(tech => {
            protection += tech.level * tech.protection;
        });

        if (protection === 0) return 'Basic';
        if (protection < 50) return 'Low';
        if (protection < 100) return 'Medium';
        if (protection < 200) return 'High';
        return 'Maximum';
    }

    calculateProfitMultiplier() {
        let multiplier = 1.0;
        this.technologies.profit.forEach(tech => {
            multiplier += tech.level * tech.bonus;
        });
        return multiplier;
    }

    researchTech(category, techId) {
        const tech = this.technologies[category].find(t => t.id === techId);
        if (!tech) return;

        if (tech.level >= tech.maxLevel) {
            this.addEvent(`${tech.name} is already at max level`, 'warning');
            return;
        }

        const cost = tech.cost * (tech.level + 1);
        if (this.cashReserves < cost) {
            this.addEvent(`Not enough funds to research ${tech.name}`, 'danger');
            return;
        }

        this.cashReserves -= cost;
        tech.level++;

        this.securityLevel = this.calculateSecurityLevel();
        this.profitMultiplier = this.calculateProfitMultiplier();

        this.addEvent(`✓ Researched ${tech.name} (Level ${tech.level})`, 'success');
        this.renderTechTree();
        this.updateDisplay();
    }

    renderTechTree() {
        const securityDiv = document.getElementById('securityTech');
        const profitDiv = document.getElementById('profitTech');
        const customerDiv = document.getElementById('customerTech');
        const efficiencyDiv = document.getElementById('efficiencyTech');

        if (securityDiv) securityDiv.innerHTML = '';
        if (profitDiv) profitDiv.innerHTML = '';
        if (customerDiv) customerDiv.innerHTML = '';
        if (efficiencyDiv) efficiencyDiv.innerHTML = '';

        this.technologies.security.forEach(tech => {
            if (tech.minYear && this.currentYear < tech.minYear) return;
            if (securityDiv) securityDiv.appendChild(this.createTechButton('security', tech));
        });

        this.technologies.profit.forEach(tech => {
            if (tech.minYear && this.currentYear < tech.minYear) return;
            if (profitDiv) profitDiv.appendChild(this.createTechButton('profit', tech));
        });

        this.technologies.customer.forEach(tech => {
            if (tech.minYear && this.currentYear < tech.minYear) return;
            if (customerDiv) customerDiv.appendChild(this.createTechButton('customer', tech));
        });

        this.technologies.efficiency.forEach(tech => {
            if (tech.minYear && this.currentYear < tech.minYear) return;
            if (efficiencyDiv) efficiencyDiv.appendChild(this.createTechButton('efficiency', tech));
        });
    }

    createTechButton(category, tech) {
        const div = document.createElement('div');
        div.className = 'tech-item';

        const cost = tech.cost * (tech.level + 1);
        const isMaxed = tech.level >= tech.maxLevel;
        const canAfford = this.cashReserves >= cost;

        div.innerHTML = `
            <div class="tech-name">${tech.name}</div>
            <div class="tech-desc">${tech.desc || ''}</div>
            <div class="tech-level">Level: ${tech.level}/${tech.maxLevel}</div>
            <div class="tech-cost">Cost: $${cost}</div>
            <button
                onclick="game.researchTech('${category}', '${tech.id}')"
                ${isMaxed ? 'disabled' : ''}
                class="${canAfford ? 'can-afford' : ''}"
            >
                ${isMaxed ? 'MAXED' : 'Research'}
            </button>
        `;

        return div;
    }

    // Thief/Security Events
    processThiefEvents() {
        const monthsSinceLastAttempt = (this.currentYear - this.lastThiefAttempt) * 12;

        // Thief attempts get more common over time, but security helps
        const baseChance = 0.05; // 5% per month
        const securityReduction = this.getSecurityProtection() / 500; // Up to 60% reduction
        const thiefChance = Math.max(0.01, baseChance - securityReduction);

        if (Math.random() < thiefChance && monthsSinceLastAttempt > 6) {
            this.handleThiefAttempt();
        }
    }

    getSecurityProtection() {
        let protection = 0;
        this.technologies.security.forEach(tech => {
            protection += tech.level * tech.protection;
        });
        // Add guard bonuses
        const staffBonuses = this.getStaffBonuses();
        protection += staffBonuses.securityBonus;
        return protection;
    }

    handleThiefAttempt() {
        this.lastThiefAttempt = this.currentYear;
        const protection = this.getSecurityProtection();
        const thiefSkill = Math.random() * 100 + 50; // 50-150 skill

        if (protection > thiefSkill) {
            this.statistics.totals.robberiesPrevented++;
            this.addEvent('🚨 Thief attempted robbery but was thwarted by security!', 'success');
        } else {
            const stolenAmount = Math.floor(this.cashReserves * (Math.random() * 0.15 + 0.05)); // 5-20%
            this.cashReserves = Math.max(0, this.cashReserves - stolenAmount);
            this.customerTrust = Math.max(0, this.customerTrust - 15);
            this.statistics.totals.robberiesSucceeded++;
            this.addEvent(`🚨 ROBBERY! Thieves stole $${stolenAmount}! Customer trust decreased!`, 'danger');
        }
    }

    // Customer Random Events
    processCustomerEvents() {
        // Economic events based on era
        if (this.era.id === 'depression' && Math.random() < 0.15) {
            const withdrawalAmount = Math.floor(this.customerDeposits * 0.2);
            if (this.cashReserves >= withdrawalAmount) {
                this.cashReserves -= withdrawalAmount;
                this.customerDeposits -= withdrawalAmount;
                this.addEvent('Bank run! Customers withdrawing due to depression fears', 'danger');
            } else {
                this.customerTrust = Math.max(0, this.customerTrust - 20);
                this.addEvent('Failed to handle bank run! Trust severely damaged!', 'danger');
            }
        }

        // Trust recovery (boosted by customer service tech)
        if (this.customerTrust < 100) {
            const recovery = this.getTrustRecoveryBonus();
            this.customerTrust = Math.min(100, this.customerTrust + recovery);
        }
    }

    // Event Log
    addEvent(message, type = 'info') {
        const eventDiv = document.getElementById('eventLog');
        const event = document.createElement('div');
        event.className = `event event-${type}`;
        event.textContent = `[${this.monthNames[this.currentMonth - 1]} ${this.currentYear}] ${message}`;

        eventDiv.insertBefore(event, eventDiv.firstChild);

        // Keep only last 10 events
        while (eventDiv.children.length > 10) {
            eventDiv.removeChild(eventDiv.lastChild);
        }
    }

    // Display Updates
    updateDisplay() {
        const totalAssets = this.cashReserves + this.investments.bonds +
                          this.investments.stocks + this.investments.speculative;

        document.getElementById('totalAssets').textContent = `$${Math.floor(totalAssets)}`;
        document.getElementById('cashReserves').textContent = `$${Math.floor(this.cashReserves)}`;
        document.getElementById('investedFunds').textContent =
            `$${Math.floor(this.investments.bonds + this.investments.stocks + this.investments.speculative)}`;
        document.getElementById('customerDeposits').textContent = `$${Math.floor(this.customerDeposits)}`;

        const reserveRatio = this.customerDeposits > 0
            ? (this.cashReserves / this.customerDeposits * 100).toFixed(1)
            : 100;
        const reserveElem = document.getElementById('reserveRatio');
        reserveElem.textContent = `${reserveRatio}%`;

        // Color code reserve ratio
        if (reserveRatio < 20) {
            reserveElem.style.color = '#ff4444';
        } else if (reserveRatio < 50) {
            reserveElem.style.color = '#ffaa00';
        } else {
            reserveElem.style.color = '#44ff44';
        }

        document.getElementById('securityLevel').textContent = this.securityLevel;
        document.getElementById('activeAccounts').textContent = this.activeAccounts;
        document.getElementById('customerTrust').textContent = `${Math.floor(this.customerTrust)}%`;
        document.getElementById('gameDate').textContent =
            `${this.monthNames[this.currentMonth - 1]} ${this.currentDay}, ${this.currentYear}`;
        document.getElementById('yearsInBusiness').textContent = this.currentYear - 1920;
        document.getElementById('totalProfit').textContent = `$${Math.floor(this.totalProfit)}`;
        document.getElementById('eraDisplay').textContent = `Era: ${this.era.name}`;

        // Update teller capacity display
        const tellerCapElem = document.getElementById('tellerCapacity');
        if (tellerCapElem) {
            tellerCapElem.textContent = `${this.dailyTellerUsed}/${this.dailyTellerCapacity}`;
            // Color code based on usage
            const usagePercent = this.dailyTellerCapacity > 0 ? (this.dailyTellerUsed / this.dailyTellerCapacity) * 100 : 0;
            if (usagePercent >= 90) {
                tellerCapElem.style.color = '#ff4444';
            } else if (usagePercent >= 70) {
                tellerCapElem.style.color = '#ffaa00';
            } else {
                tellerCapElem.style.color = '#44ff44';
            }
        }

        // Update portfolio display
        const portfolio = [];
        if (this.investments.bonds > 0) portfolio.push(`Bonds: $${Math.floor(this.investments.bonds)}`);
        if (this.investments.stocks > 0) portfolio.push(`Stocks: $${Math.floor(this.investments.stocks)}`);
        if (this.investments.speculative > 0) portfolio.push(`Speculative: $${Math.floor(this.investments.speculative)}`);

        document.getElementById('portfolioDisplay').innerHTML =
            portfolio.length > 0 ? portfolio.join('<br>') : 'No investments yet';

        // Update objectives display
        this.updateObjectivesDisplay();

        // Update loan display
        this.updateLoanDisplay();

        // Update staff display
        this.updateStaffDisplay();

        // Update total wages display
        const wagesElem = document.getElementById('totalWages');
        if (wagesElem) {
            wagesElem.textContent = this.getStaffWages();
        }
    }

    // Objectives System
    checkObjectives() {
        this.objectives.forEach(obj => {
            if (obj.completed) return;

            let progress = 0;
            let complete = false;

            switch (obj.type) {
                case 'cash':
                    progress = this.cashReserves;
                    complete = this.cashReserves >= obj.target;
                    break;
                case 'year':
                    progress = this.currentYear;
                    complete = this.currentYear >= obj.target;
                    break;
                case 'profit':
                    progress = this.totalProfit;
                    complete = this.totalProfit >= obj.target;
                    break;
                case 'accounts':
                    progress = this.activeAccounts;
                    complete = this.activeAccounts >= obj.target;
                    break;
                case 'trust':
                    if (this.customerTrust >= 100) {
                        obj.counter = (obj.counter || 0) + 1;
                    } else {
                        obj.counter = 0;
                    }
                    progress = obj.counter;
                    complete = obj.counter >= obj.target;
                    break;
                case 'security':
                    const securityMaxed = this.technologies.security.every(t => t.level >= t.maxLevel);
                    complete = securityMaxed;
                    break;
                case 'profit_tech':
                    const profitMaxed = this.technologies.profit.every(t => t.level >= t.maxLevel);
                    complete = profitMaxed;
                    break;
            }

            if (complete) {
                obj.completed = true;
                this.cashReserves += obj.reward;
                this.addEvent(`🎯 Objective Complete: ${obj.name}! Reward: $${obj.reward}`, 'success');
            }
        });
    }

    updateObjectivesDisplay() {
        const container = document.getElementById('objectivesList');
        if (!container) return;

        container.innerHTML = '';

        // Show only incomplete objectives (first 5) and recently completed (last 3)
        const incomplete = this.objectives.filter(o => !o.completed).slice(0, 5);
        const completed = this.objectives.filter(o => o.completed).slice(-3);

        [...incomplete, ...completed].forEach(obj => {
            const div = document.createElement('div');
            div.className = obj.completed ? 'objective completed' : 'objective';

            let progress = 0;
            switch (obj.type) {
                case 'cash': progress = this.cashReserves; break;
                case 'year': progress = this.currentYear; break;
                case 'profit': progress = this.totalProfit; break;
                case 'accounts': progress = this.activeAccounts; break;
                case 'trust': progress = obj.counter || 0; break;
                case 'security':
                case 'profit_tech': progress = obj.completed ? 1 : 0; break;
            }

            const percentage = Math.min(100, (progress / obj.target) * 100);

            div.innerHTML = `
                <div class="objective-name">${obj.completed ? '✓' : '○'} ${obj.name}</div>
                <div class="objective-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <div class="objective-reward">Reward: $${obj.reward}</div>
                </div>
            `;

            container.appendChild(div);
        });
    }

    getCustomerBonus() {
        let bonus = 0;
        this.technologies.customer.forEach(tech => {
            bonus += tech.level * tech.benefit;
        });
        // Add staff bonuses
        const staffBonuses = this.getStaffBonuses();
        bonus += staffBonuses.customerBonus;
        return bonus;
    }

    getTrustRecoveryBonus() {
        let bonus = 1; // Base recovery
        this.technologies.customer.forEach(tech => {
            if (tech.id === 'service') {
                bonus += tech.level * (tech.benefit / 100); // Convert to multiplier
            }
        });
        return bonus;
    }

    // Statistics System
    recordHistoricalData() {
        const dataPoint = {
            month: this.currentMonth,
            year: this.currentYear,
            cash: this.cashReserves,
            deposits: this.customerDeposits,
            profit: this.totalProfit,
            accounts: this.activeAccounts
        };

        // Limit history to last 120 months (10 years)
        if (this.statistics.history.cash.length >= 120) {
            this.statistics.history.cash.shift();
            this.statistics.history.deposits.shift();
            this.statistics.history.profit.shift();
            this.statistics.history.accounts.shift();
        }

        this.statistics.history.cash.push(dataPoint.cash);
        this.statistics.history.deposits.push(dataPoint.deposits);
        this.statistics.history.profit.push(dataPoint.profit);
        this.statistics.history.accounts.push(dataPoint.accounts);
    }

    toggleStatistics() {
        this.showStatistics = !this.showStatistics;
        const panel = document.getElementById('statisticsPanel');
        const btn = document.getElementById('toggleStatsBtn');

        if (this.showStatistics) {
            panel.style.display = 'block';
            btn.classList.add('active');
            this.renderStatistics();
        } else {
            panel.style.display = 'none';
            btn.classList.remove('active');
        }
    }

    renderStatistics() {
        // Update stat totals
        document.getElementById('statCustomersServed').textContent = this.statistics.totals.customersServed;
        document.getElementById('statDepositsProcessed').textContent = this.statistics.totals.depositsProcessed;
        document.getElementById('statWithdrawalsProcessed').textContent = this.statistics.totals.withdrawalsProcessed;
        document.getElementById('statLoansIssued').textContent = this.totalLoansIssued;
        document.getElementById('statLoanDefaults').textContent = this.totalLoanDefaults;
        document.getElementById('statRobberiesPrevented').textContent = this.statistics.totals.robberiesPrevented;
        document.getElementById('statRobberiesSucceeded').textContent = this.statistics.totals.robberiesSucceeded;

        // Render charts
        this.renderChart('cashChart', this.statistics.history.cash, 'Cash Reserves', '#44ff44');
        this.renderChart('depositsChart', this.statistics.history.deposits, 'Customer Deposits', '#00aaff');
        this.renderChart('profitChart', this.statistics.history.profit, 'Total Profit', '#ffaa00');
        this.renderChart('accountsChart', this.statistics.history.accounts, 'Active Accounts', '#ff44ff');
    }

    renderChart(canvasId, data, label, color) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // Clear canvas
        ctx.fillStyle = '#001100';
        ctx.fillRect(0, 0, width, height);

        if (data.length < 2) {
            ctx.fillStyle = '#44ff44';
            ctx.font = '12px monospace';
            ctx.fillText('Not enough data yet...', 10, height / 2);
            return;
        }

        // Find min and max for scaling
        const max = Math.max(...data, 1);
        const min = Math.min(...data, 0);
        const range = max - min || 1;

        // Draw grid lines
        ctx.strokeStyle = '#003300';
        ctx.lineWidth = 1;
        for (let i = 0; i < 5; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Draw line chart
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();

        const pointSpacing = width / (data.length - 1);

        data.forEach((value, index) => {
            const x = index * pointSpacing;
            const y = height - ((value - min) / range) * height * 0.9 - height * 0.05;

            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });

        ctx.stroke();

        // Draw points
        ctx.fillStyle = color;
        data.forEach((value, index) => {
            const x = index * pointSpacing;
            const y = height - ((value - min) / range) * height * 0.9 - height * 0.05;
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Draw labels
        ctx.fillStyle = '#44ff44';
        ctx.font = '10px monospace';
        ctx.fillText(`Max: $${Math.floor(max)}`, 5, 12);
        ctx.fillText(`Min: $${Math.floor(min)}`, 5, height - 5);
        ctx.fillText(label, width - ctx.measureText(label).width - 5, 12);
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new BankGame();
});
