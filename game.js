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

        // Time and Era
        this.currentYear = 1920;
        this.currentMonth = 1;
        this.monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December'];
        this.era = this.getEra();
        this.autoAdvance = false;
        this.autoInterval = null;

        // Technology
        this.technologies = {
            security: [
                { id: 'vault1', name: 'Reinforced Vault', cost: 500, level: 0, protection: 20, maxLevel: 3 },
                { id: 'guards', name: 'Security Guards', cost: 800, level: 0, protection: 30, maxLevel: 3 },
                { id: 'alarm', name: 'Alarm System', cost: 1500, level: 0, protection: 40, maxLevel: 2 },
                { id: 'cameras', name: 'Security Cameras', cost: 3000, level: 0, protection: 50, maxLevel: 2, minYear: 1950 }
            ],
            profit: [
                { id: 'accounting', name: 'Better Accounting', cost: 400, level: 0, bonus: 0.05, maxLevel: 3 },
                { id: 'marketing', name: 'Marketing Campaign', cost: 600, level: 0, bonus: 0.08, maxLevel: 3 },
                { id: 'automation', name: 'Office Automation', cost: 2000, level: 0, bonus: 0.15, maxLevel: 2, minYear: 1960 },
                { id: 'digital', name: 'Digital Banking', cost: 5000, level: 0, bonus: 0.25, maxLevel: 2, minYear: 1990 }
            ]
        };

        // Game Stats
        this.securityLevel = this.calculateSecurityLevel();
        this.profitMultiplier = this.calculateProfitMultiplier();

        // Events
        this.eventLog = [];
        this.lastThiefAttempt = 0;

        this.init();
    }

    init() {
        this.updateDisplay();
        this.renderTechTree();
        this.scheduleCustomer();
        this.checkAutoSave();
    }

    // Save/Load System
    saveGame() {
        const saveData = {
            version: '1.0',
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
        this.currentMonth++;
        if (this.currentMonth > 12) {
            this.currentMonth = 1;
            this.currentYear++;
            this.era = this.getEra();
            this.renderTechTree(); // Update available tech
            // Auto-save every year
            this.saveGame();
        }

        // Process monthly events
        this.processInvestments();
        this.processCustomerEvents();
        this.processThiefEvents();

        this.updateDisplay();
    }

    toggleAutoPause() {
        this.autoAdvance = !this.autoAdvance;
        const btn = document.getElementById('autoBtn');

        if (this.autoAdvance) {
            btn.textContent = 'Auto: ON';
            btn.classList.add('active');
            this.autoInterval = setInterval(() => this.advanceTime(), 2000);
        } else {
            btn.textContent = 'Auto: OFF';
            btn.classList.remove('active');
            clearInterval(this.autoInterval);
        }
    }

    // Customer Management
    scheduleCustomer() {
        const delay = Math.random() * 3000 + 2000; // 2-5 seconds
        setTimeout(() => {
            this.generateCustomer();
            this.scheduleCustomer();
        }, delay);
    }

    generateCustomer() {
        const types = ['deposit', 'deposit', 'deposit', 'withdrawal']; // More deposits than withdrawals
        const type = types[Math.floor(Math.random() * types.length)];

        let amount;
        if (type === 'deposit') {
            amount = Math.floor(Math.random() * 500 + 100);
        } else {
            // Can only withdraw if there are deposits
            if (this.customerDeposits <= 0) return;
            amount = Math.floor(Math.random() * Math.min(300, this.customerDeposits));
        }

        const customer = {
            type: type,
            amount: amount,
            id: Date.now()
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
            </div>
            <div class="customer-actions">
                <button onclick="game.handleCustomer(${customer.id}, true)" class="approve-btn">✓ Approve</button>
                <button onclick="game.handleCustomer(${customer.id}, false)" class="deny-btn">✗ Deny</button>
            </div>
        `;

        queueDiv.appendChild(customerDiv);

        // Auto-remove after 15 seconds
        setTimeout(() => {
            const elem = document.getElementById(`customer-${customer.id}`);
            if (elem) {
                this.handleCustomer(customer.id, false);
            }
        }, 15000);
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
                this.addEvent(`✓ Accepted deposit of $${customer.amount}`, 'success');
            } else { // withdrawal
                if (this.cashReserves >= customer.amount) {
                    this.cashReserves -= customer.amount;
                    this.customerDeposits -= customer.amount;
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
            this.addEvent(`Denied customer request for $${customer.amount}`, 'warning');
        }

        this.customerQueue.splice(customerIndex, 1);
        if (customerDiv) customerDiv.remove();
        this.updateDisplay();
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

        securityDiv.innerHTML = '';
        profitDiv.innerHTML = '';

        this.technologies.security.forEach(tech => {
            if (tech.minYear && this.currentYear < tech.minYear) return;
            securityDiv.appendChild(this.createTechButton('security', tech));
        });

        this.technologies.profit.forEach(tech => {
            if (tech.minYear && this.currentYear < tech.minYear) return;
            profitDiv.appendChild(this.createTechButton('profit', tech));
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
        return protection;
    }

    handleThiefAttempt() {
        this.lastThiefAttempt = this.currentYear;
        const protection = this.getSecurityProtection();
        const thiefSkill = Math.random() * 100 + 50; // 50-150 skill

        if (protection > thiefSkill) {
            this.addEvent('🚨 Thief attempted robbery but was thwarted by security!', 'success');
        } else {
            const stolenAmount = Math.floor(this.cashReserves * (Math.random() * 0.15 + 0.05)); // 5-20%
            this.cashReserves = Math.max(0, this.cashReserves - stolenAmount);
            this.customerTrust = Math.max(0, this.customerTrust - 15);
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

        // Trust recovery
        if (this.customerTrust < 100) {
            this.customerTrust = Math.min(100, this.customerTrust + 1);
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
            `${this.monthNames[this.currentMonth - 1]} ${this.currentYear}`;
        document.getElementById('yearsInBusiness').textContent = this.currentYear - 1920;
        document.getElementById('totalProfit').textContent = `$${Math.floor(this.totalProfit)}`;
        document.getElementById('eraDisplay').textContent = `Era: ${this.era.name}`;

        // Update portfolio display
        const portfolio = [];
        if (this.investments.bonds > 0) portfolio.push(`Bonds: $${Math.floor(this.investments.bonds)}`);
        if (this.investments.stocks > 0) portfolio.push(`Stocks: $${Math.floor(this.investments.stocks)}`);
        if (this.investments.speculative > 0) portfolio.push(`Speculative: $${Math.floor(this.investments.speculative)}`);

        document.getElementById('portfolioDisplay').innerHTML =
            portfolio.length > 0 ? portfolio.join('<br>') : 'No investments yet';
    }
}

// Initialize game when page loads
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new BankGame();
});
