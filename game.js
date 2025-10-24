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

        // Customer Segments
        this.customerSegments = {
            retail: { count: 0, deposits: 0, satisfaction: 100 },
            business: { count: 0, deposits: 0, satisfaction: 100 },
            vip: { count: 0, deposits: 0, satisfaction: 100 }
        };

        // Interest Rates
        this.depositInterestRate = 0.02; // 2% annual - what you pay depositors
        this.loanBaseRate = 0.06; // 6% annual - base rate for loans (specific loans add to this)
        this.marketRates = {
            deposit: 0.02, // Market average for deposits
            loan: 0.06     // Market average for loans
        };

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
        this.timeSpeed = 10000; // milliseconds per day (10s normal, 15s slow, 5s fast)
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
            // Profit & Loss Tracking
            currentMonth: {
                revenue: {
                    loanInterest: 0,
                    investmentReturns: 0,
                    productRevenue: 0,
                    fees: 0,
                    total: 0
                },
                expenses: {
                    depositInterest: 0,
                    staffWages: 0,
                    loanDefaults: 0,
                    robberyLosses: 0,
                    techUpgrades: 0,
                    operationalCosts: 0,
                    total: 0
                },
                netIncome: 0
            },

            // Historical P&L Data
            history: {
                monthly: {
                    revenue: [],
                    expenses: [],
                    netIncome: [],
                    loanInterestIncome: [],
                    investmentReturns: [],
                    productRevenue: [],
                    depositInterestExpense: [],
                    wageExpense: [],
                    defaultExpense: [],
                    timestamps: [] // {month, year}
                },
                cash: [],
                deposits: [],
                profit: [],
                accounts: [],
                marketShare: [],
                customerTrust: [],
                reserveRatio: []
            },

            // Operational Metrics
            totals: {
                customersServed: 0,
                depositsProcessed: 0,
                withdrawalsProcessed: 0,
                loansIssued: 0,
                loanDefaults: 0,
                robberiesPrevented: 0,
                robberiesSucceeded: 0,
                totalRevenueAllTime: 0,
                totalExpensesAllTime: 0,
                totalProfitAllTime: 0
            },

            // Current Period Analytics
            analytics: {
                averageDepositSize: 0,
                averageLoanSize: 0,
                loanDefaultRate: 0,
                customerAcquisitionRate: 0,
                returnOnAssets: 0,
                returnOnEquity: 0,
                netInterestMargin: 0,
                efficiencyRatio: 0,
                revenuePerEmployee: 0,
                profitPerCustomer: 0
            },

            // Product-level Analytics
            productStats: {},

            // Customer Segment Analytics
            segmentStats: {
                retail: { revenue: 0, costs: 0, profit: 0, count: 0 },
                business: { revenue: 0, costs: 0, profit: 0, count: 0 },
                vip: { revenue: 0, costs: 0, profit: 0, count: 0 }
            }
        };
        this.showStatistics = false;
        this.showCompetitors = false;
        this.showEconomy = false;
        this.showBranches = false;
        this.showProducts = false;

        // Random Events System
        this.activeEvent = null; // Currently displayed event
        this.eventHistory = []; // Past events
        this.lastEventMonth = 0; // Prevent event spam
        this.eventEffects = []; // Active temporary effects

        // Historical Crisis Events (only trigger once)
        this.historicalCrises = {
            crash1929: false,
            bankHoliday1933: false,
            oilCrisis1973: false,
            financialCrisis2008: false,
            covidPandemic2020: false
        };

        // Competitor Banks
        this.competitors = [];
        this.marketShare = 100; // Your % of market
        this.initializeCompetitors();

        // Economic Indicators
        this.economy = {
            inflation: 0.02, // 2% base
            unemployment: 0.05, // 5% base
            gdpGrowth: 0.03, // 3% base
            stockMarketIndex: 1000, // Base value
            consumerConfidence: 70 // 0-100 scale
        };

        // Branch Expansion
        this.branches = [
            {
                id: 'main',
                name: 'Main Branch',
                location: 'Downtown',
                deposits: 0,
                customers: 0,
                staff: { tellers: 0, guards: 0 },
                level: 1,
                unlocked: true
            }
        ];
        this.activeBranch = 'main'; // Currently viewing branch

        // Financial Products
        this.products = {
            savings: { unlocked: true, minYear: 1920, profitMargin: 0.01, customers: 0 },
            checking: { unlocked: false, minYear: 1950, profitMargin: 0.005, customers: 0 },
            creditCards: { unlocked: false, minYear: 1958, profitMargin: 0.15, customers: 0 },
            autoLoans: { unlocked: false, minYear: 1950, profitMargin: 0.03, customers: 0 },
            mortgages: { unlocked: false, minYear: 1930, profitMargin: 0.025, customers: 0 },
            moneyMarket: { unlocked: false, minYear: 1971, profitMargin: 0.02, customers: 0 },
            mutualFunds: { unlocked: false, minYear: 1990, profitMargin: 0.08, customers: 0 },
            onlineBanking: { unlocked: false, minYear: 1995, profitMargin: 0.01, customers: 0 },
            mobileBanking: { unlocked: false, minYear: 2007, profitMargin: 0.015, customers: 0 },
            cryptocurrency: { unlocked: false, minYear: 2015, profitMargin: 0.20, customers: 0 }
        };

        // Objectives & Achievements System
        this.objectives = [
            // Financial Milestones
            { id: 'cash_5k', name: '💰 First Milestone', desc: 'Reach $5,000 cash', target: 5000, type: 'cash', completed: false, reward: 500, hidden: false },
            { id: 'cash_10k', name: '💰 Growing Business', desc: 'Reach $10,000 cash', target: 10000, type: 'cash', completed: false, reward: 1000, hidden: false },
            { id: 'cash_50k', name: '💰 Major Player', desc: 'Reach $50,000 cash', target: 50000, type: 'cash', completed: false, reward: 5000, hidden: false },
            { id: 'cash_250k', name: '💰 Banking Empire', desc: 'Reach $250,000 cash', target: 250000, type: 'cash', completed: false, reward: 25000, hidden: false },

            // Time Milestones
            { id: 'year_1930', name: '⏰ Survived the Twenties', desc: 'Reach 1930', target: 1930, type: 'year', completed: false, reward: 2000, hidden: false },
            { id: 'year_1950', name: '⏰ Post-War Prosperity', desc: 'Reach 1950', target: 1950, type: 'year', completed: false, reward: 5000, hidden: false },
            { id: 'year_1970', name: '⏰ Modern Banking', desc: 'Reach 1970', target: 1970, type: 'year', completed: false, reward: 10000, hidden: false },
            { id: 'year_2000', name: '⏰ New Millennium', desc: 'Reach 2000', target: 2000, type: 'year', completed: false, reward: 20000, hidden: false },

            // Profit Achievements
            { id: 'profit_10k', name: '📈 Profitable', desc: 'Earn $10,000 total profit', target: 10000, type: 'profit', completed: false, reward: 2000, hidden: false },
            { id: 'profit_50k', name: '📈 Profit Machine', desc: 'Earn $50,000 total profit', target: 50000, type: 'profit', completed: false, reward: 10000, hidden: false },
            { id: 'profit_250k', name: '📈 Wealth Generator', desc: 'Earn $250,000 total profit', target: 250000, type: 'profit', completed: false, reward: 25000, hidden: false },

            // Customer Achievements
            { id: 'accounts_50', name: '👥 Growing Clientele', desc: 'Reach 50 active accounts', target: 50, type: 'accounts', completed: false, reward: 1000, hidden: false },
            { id: 'accounts_100', name: '👥 Established Bank', desc: 'Reach 100 active accounts', target: 100, type: 'accounts', completed: false, reward: 3000, hidden: false },
            { id: 'accounts_500', name: '👥 Customer Magnet', desc: 'Reach 500 active accounts', target: 500, type: 'accounts', completed: false, reward: 15000, hidden: false },

            // Tech Achievements
            { id: 'security_max', name: '🔒 Fort Knox', desc: 'Max out all security tech', target: 1, type: 'security', completed: false, reward: 5000, hidden: false },
            { id: 'profit_max', name: '💹 Optimization Master', desc: 'Max out all profit tech', target: 1, type: 'profit_tech', completed: false, reward: 5000, hidden: false },
            { id: 'all_tech_max', name: '🔬 Tech Pioneer', desc: 'Max out ALL technologies', target: 1, type: 'all_tech', completed: false, reward: 20000, hidden: false },

            // Challenge Achievements (Hidden)
            { id: 'no_defaults', name: '⭐ Perfect Record', desc: 'Issue 50 loans with zero defaults', target: 50, type: 'no_defaults', completed: false, reward: 10000, hidden: true, counter: 0 },
            { id: 'trust_perfect', name: '⭐ Trusted Institution', desc: 'Maintain 100% trust for 1 year', target: 12, type: 'trust', completed: false, reward: 5000, hidden: true, counter: 0 },
            { id: 'market_leader', name: '⭐ Market Domination', desc: 'Achieve 50%+ market share', target: 50, type: 'market_share', completed: false, reward: 15000, hidden: true },
            { id: 'crisis_survivor', name: '⭐ Crisis Manager', desc: 'Survive 5 major events successfully', target: 5, type: 'events', completed: false, reward: 10000, hidden: true, counter: 0 },
            { id: 'vip_collector', name: '⭐ VIP Magnet', desc: 'Have 20+ VIP customers', target: 20, type: 'vip_customers', completed: false, reward: 8000, hidden: true },
            { id: 'expansion_master', name: '⭐ Branch Network', desc: 'Open 5 branches', target: 5, type: 'branches', completed: false, reward: 20000, hidden: true },
            { id: 'product_portfolio', name: '⭐ Full Service Bank', desc: 'Unlock all financial products', target: 10, type: 'products', completed: false, reward: 15000, hidden: true },
            { id: 'rate_master', name: '⭐ Rate Strategist', desc: 'Beat market rates for 12 months straight', target: 12, type: 'competitive_rates', completed: false, reward: 5000, hidden: true, counter: 0 },
            { id: 'automation_king', name: '⭐ Hands-Off Manager', desc: 'Enable all automation options', target: 1, type: 'automation', completed: false, reward: 10000, hidden: true }
        ];

        this.init();
    }

    init() {
        this.unlockProducts(); // Check for new products
        this.updateDisplay();
        this.renderTechTree();
        this.checkAutoSave();
        this.startAutoAdvance(); // Start time progression automatically
    }

    // Competitor Banks System
    initializeCompetitors() {
        const names = [
            'First National Bank', 'Citizens Bank', 'Metro Bank', 'Trust & Savings',
            'Community Bank', 'United Bank', 'Federal Reserve Bank'
        ];

        // Start with 2 competitors
        for (let i = 0; i < 2; i++) {
            this.competitors.push({
                name: names[i],
                deposits: Math.floor(Math.random() * 3000 + 2000),
                depositRate: 0.02 + (Math.random() - 0.5) * 0.005,
                loanRate: 0.06 + (Math.random() - 0.5) * 0.01,
                customers: Math.floor(Math.random() * 30 + 20),
                trust: Math.floor(Math.random() * 20 + 70)
            });
        }
        this.calculateMarketShare();
    }

    calculateMarketShare() {
        const totalMarket = this.customerDeposits + this.competitors.reduce((sum, comp) => sum + comp.deposits, 0);
        if (totalMarket > 0) {
            this.marketShare = (this.customerDeposits / totalMarket) * 100;
            // Calculate each competitor's market share too
            this.competitors.forEach(comp => {
                comp.marketShare = (comp.deposits / totalMarket) * 100;
            });
        } else {
            this.marketShare = 100;
            this.competitors.forEach(comp => {
                comp.marketShare = 0;
            });
        }
    }

    processCompetitors() {
        // Competitors adjust their rates based on market
        this.competitors.forEach(comp => {
            // Competitors gradually adjust towards market rates with some variation
            const depositAdjust = (this.marketRates.deposit - comp.depositRate) * 0.1;
            const loanAdjust = (this.marketRates.loan - comp.loanRate) * 0.1;

            comp.depositRate += depositAdjust + (Math.random() - 0.5) * 0.002;
            comp.loanRate += loanAdjust + (Math.random() - 0.5) * 0.002;

            // Constrain rates
            comp.depositRate = Math.max(0.005, Math.min(0.10, comp.depositRate));
            comp.loanRate = Math.max(0.03, Math.min(0.15, comp.loanRate));

            // Grow/shrink deposits based on rates and economy
            const growthFactor = 1 + this.economy.gdpGrowth + (Math.random() - 0.5) * 0.02;
            comp.deposits *= growthFactor;
            comp.customers = Math.floor(comp.customers * growthFactor);

            // Trust changes slowly
            comp.trust += (Math.random() - 0.5) * 3;
            comp.trust = Math.max(50, Math.min(100, comp.trust));
        });

        this.calculateMarketShare();
    }

    // Economic Indicators System
    updateEconomy() {
        // Update economic indicators monthly
        const eraEffects = {
            'roaring20s': { inflation: 0.00, unemployment: -0.02, gdpGrowth: 0.04 },
            'depression': { inflation: -0.05, unemployment: 0.15, gdpGrowth: -0.08 },
            'wartime': { inflation: 0.03, unemployment: -0.05, gdpGrowth: 0.06 },
            'postwar': { inflation: 0.02, unemployment: 0.00, gdpGrowth: 0.05 },
            'modern': { inflation: 0.04, unemployment: 0.01, gdpGrowth: 0.03 },
            'digital': { inflation: 0.02, unemployment: 0.00, gdpGrowth: 0.04 },
            'fintech': { inflation: 0.015, unemployment: -0.01, gdpGrowth: 0.035 },
            'future': { inflation: 0.01, unemployment: -0.02, gdpGrowth: 0.04 }
        };

        const era = eraEffects[this.era.id] || { inflation: 0.02, unemployment: 0.05, gdpGrowth: 0.03 };

        // Gradually move towards era-appropriate values with random variation
        this.economy.inflation += (era.inflation - this.economy.inflation) * 0.05 + (Math.random() - 0.5) * 0.01;
        this.economy.unemployment += (era.unemployment - this.economy.unemployment) * 0.05 + (Math.random() - 0.5) * 0.005;
        this.economy.gdpGrowth += (era.gdpGrowth - this.economy.gdpGrowth) * 0.05 + (Math.random() - 0.5) * 0.01;

        // Constrain values
        this.economy.inflation = Math.max(-0.10, Math.min(0.15, this.economy.inflation));
        this.economy.unemployment = Math.max(0.02, Math.min(0.25, this.economy.unemployment));
        this.economy.gdpGrowth = Math.max(-0.10, Math.min(0.10, this.economy.gdpGrowth));

        // Update stock market based on GDP growth
        this.economy.stockMarketIndex *= (1 + this.economy.gdpGrowth / 12 + (Math.random() - 0.5) * 0.05);
        this.economy.stockMarketIndex = Math.max(100, this.economy.stockMarketIndex);

        // Consumer confidence affected by unemployment and GDP
        const confidenceTarget = 70 + this.economy.gdpGrowth * 500 - this.economy.unemployment * 200;
        this.economy.consumerConfidence += (confidenceTarget - this.economy.consumerConfidence) * 0.1;
        this.economy.consumerConfidence = Math.max(20, Math.min(100, this.economy.consumerConfidence));

        // Apply economic effects to market rates
        this.marketRates.deposit += this.economy.inflation * 0.5;
        this.marketRates.loan += this.economy.inflation * 0.3;
    }

    // Financial Products System
    unlockProducts() {
        let newUnlocks = false;
        for (let productId in this.products) {
            const product = this.products[productId];
            if (!product.unlocked && this.currentYear >= product.minYear) {
                product.unlocked = true;
                newUnlocks = true;
                this.addEvent(`🎉 NEW PRODUCT: ${this.getProductName(productId)} now available!`, 'success');
            }
        }
        return newUnlocks;
    }

    getProductName(id) {
        const names = {
            savings: 'Savings Accounts',
            checking: 'Checking Accounts',
            creditCards: 'Credit Cards',
            autoLoans: 'Auto Loans',
            mortgages: 'Mortgages',
            moneyMarket: 'Money Market Accounts',
            mutualFunds: 'Mutual Funds',
            onlineBanking: 'Online Banking',
            mobileBanking: 'Mobile Banking',
            cryptocurrency: 'Cryptocurrency Services'
        };
        return names[id] || id;
    }

    processProductRevenue() {
        let totalRevenue = 0;
        for (let productId in this.products) {
            const product = this.products[productId];
            if (product.unlocked && product.customers > 0) {
                // Each customer generates monthly revenue based on profit margin
                const revenue = product.customers * product.profitMargin * 100; // Base $100 per customer
                totalRevenue += revenue;
                this.totalProfit += revenue;
            }
        }

        if (totalRevenue > 0) {
            this.cashReserves += totalRevenue;
            this.trackRevenue('productRevenue', totalRevenue);
            this.addEvent(`📦 Product Revenue: +$${Math.floor(totalRevenue)}`, 'success');
        }
    }

    assignCustomersToProducts() {
        // New customers are assigned to products
        const unlockedProducts = Object.keys(this.products).filter(id => this.products[id].unlocked);
        if (unlockedProducts.length === 0) return;

        // Distribute some customers to products based on segment
        const retailCustomers = this.customerSegments.retail.count;
        const businessCustomers = this.customerSegments.business.count;
        const vipCustomers = this.customerSegments.vip.count;

        // Clear old assignments
        for (let id in this.products) {
            this.products[id].customers = 0;
        }

        // Retail prefers basic products
        if (this.products.savings.unlocked) this.products.savings.customers += Math.floor(retailCustomers * 0.8);
        if (this.products.checking.unlocked) this.products.checking.customers += Math.floor(retailCustomers * 0.6);
        if (this.products.creditCards.unlocked) this.products.creditCards.customers += Math.floor(retailCustomers * 0.3);
        if (this.products.mobileBanking.unlocked) this.products.mobileBanking.customers += Math.floor(retailCustomers * 0.4);

        // Business prefers business products
        if (this.products.checking.unlocked) this.products.checking.customers += Math.floor(businessCustomers * 0.9);
        if (this.products.autoLoans.unlocked) this.products.autoLoans.customers += Math.floor(businessCustomers * 0.4);
        if (this.products.mortgages.unlocked) this.products.mortgages.customers += Math.floor(businessCustomers * 0.3);
        if (this.products.onlineBanking.unlocked) this.products.onlineBanking.customers += Math.floor(businessCustomers * 0.7);

        // VIP uses premium products
        if (this.products.moneyMarket.unlocked) this.products.moneyMarket.customers += Math.floor(vipCustomers * 0.8);
        if (this.products.mutualFunds.unlocked) this.products.mutualFunds.customers += Math.floor(vipCustomers * 0.6);
        if (this.products.cryptocurrency.unlocked) this.products.cryptocurrency.customers += Math.floor(vipCustomers * 0.4);
        if (this.products.mortgages.unlocked) this.products.mortgages.customers += Math.floor(vipCustomers * 0.5);
    }

    // Save/Load System
    saveGame() {
        const saveData = {
            version: '2.0',
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
            this.processDepositInterest(); // Pay interest on deposits
            this.processLoans();
            this.processInvestments();
            this.processManagerAutomation(); // Manager automated tasks
            this.processThiefEvents();
            this.processWages();
            this.updateMarketRates(); // Update competitive rates
            this.updateEconomy(); // Update economic indicators
            this.processCompetitors(); // Update competitor banks
            this.unlockProducts(); // Check for new product unlocks
            this.assignCustomersToProducts(); // Assign customers to products
            this.processProductRevenue(); // Generate product income
            this.calculateMonthlyPnL(); // Calculate and record monthly P&L
            this.processRandomEvent(); // Trigger random events
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
                btn.textContent = '⏸️ Auto: ON';
                btn.classList.add('active');
            }
        }
    }

    toggleAutoPause() {
        this.autoAdvance = !this.autoAdvance;
        const btn = document.getElementById('autoBtn');

        if (this.autoAdvance) {
            btn.textContent = '⏸️ Auto: ON';
            btn.classList.add('active');
            this.autoInterval = setInterval(() => this.advanceTime(), this.timeSpeed);
            this.startProgressBar();
        } else {
            btn.textContent = '▶️ Auto: OFF';
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

        const speedName = speed === 5000 ? 'Fast' : speed === 10000 ? 'Normal' : 'Slow';
        this.addEvent(`Speed changed to ${speedName} (${speed/1000}s per day)`, 'info');
    }

    // Customer Management

    generateCustomer() {
        // Determine customer segment
        const segmentRoll = Math.random();
        let segment;
        if (segmentRoll < 0.70) {
            segment = 'retail'; // 70% retail customers
        } else if (segmentRoll < 0.95) {
            segment = 'business'; // 25% business customers
        } else {
            segment = 'vip'; // 5% VIP customers
        }

        // Segment affects rates and our own interest rates
        const rateAdvantage = this.getCustomerAttraction();
        if (!rateAdvantage && Math.random() < 0.3) {
            // 30% chance customer goes elsewhere if rates aren't competitive
            return;
        }

        const types = ['deposit', 'deposit', 'deposit', 'withdrawal']; // More deposits than withdrawals
        const type = types[Math.floor(Math.random() * types.length)];

        let amount;
        let canAutoApprove = this.dailyTellerUsed < this.dailyTellerCapacity;

        if (type === 'deposit') {
            // Amount varies by segment
            if (segment === 'retail') {
                amount = Math.floor(Math.random() * 500 + 100); // $100-$600
            } else if (segment === 'business') {
                amount = Math.floor(Math.random() * 3000 + 1000); // $1000-$4000
            } else { // vip
                amount = Math.floor(Math.random() * 10000 + 5000); // $5000-$15000
            }

            // Auto-approve deposits if setting is on AND teller capacity available
            if (this.automation.tellers.autoApproveDeposits && canAutoApprove) {
                this.cashReserves += amount;
                this.customerDeposits += amount;
                this.customerSegments[segment].deposits += amount;
                this.customerSegments[segment].count++;
                this.activeAccounts++;
                this.dailyTellerUsed++;
                this.statistics.totals.customersServed++;
                this.statistics.totals.depositsProcessed++;
                return; // Don't display, just process
            }
        } else {
            // Can only withdraw if there are deposits
            if (this.customerDeposits <= 0) return;

            // Withdrawal amount varies by segment
            if (segment === 'retail') {
                amount = Math.floor(Math.random() * Math.min(300, this.customerDeposits));
            } else if (segment === 'business') {
                amount = Math.floor(Math.random() * Math.min(2000, this.customerDeposits));
            } else { // vip
                amount = Math.floor(Math.random() * Math.min(8000, this.customerDeposits));
            }

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
            segment: segment,
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
        customerDiv.className = `customer-request segment-${customer.segment}`;
        customerDiv.id = `customer-${customer.id}`;

        const segmentIcons = { retail: '👤', business: '🏢', vip: '⭐' };
        const segmentLabels = { retail: 'Retail', business: 'Business', vip: 'VIP' };
        const icon = customer.type === 'deposit' ? '💰' : '💵';
        const action = customer.type === 'deposit' ? 'Deposit' : 'Withdraw';

        customerDiv.innerHTML = `
            <div class="customer-info">
                <div class="customer-segment">${segmentIcons[customer.segment]} ${segmentLabels[customer.segment]}</div>
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
                this.customerSegments[customer.segment].deposits += customer.amount;
                this.customerSegments[customer.segment].count++;
                this.activeAccounts++;
                this.statistics.totals.customersServed++;
                this.statistics.totals.depositsProcessed++;
                this.addEvent(`✓ Accepted ${customer.segment} deposit of $${customer.amount}`, 'success');
            } else { // withdrawal
                if (this.cashReserves >= customer.amount) {
                    this.cashReserves -= customer.amount;
                    this.customerDeposits -= customer.amount;
                    this.customerSegments[customer.segment].deposits -= customer.amount;
                    this.statistics.totals.customersServed++;
                    this.statistics.totals.withdrawalsProcessed++;
                    this.addEvent(`✓ Processed ${customer.segment} withdrawal of $${customer.amount}`, 'success');
                } else {
                    this.customerTrust = Math.max(0, this.customerTrust - 10);
                    this.customerSegments[customer.segment].satisfaction = Math.max(0, this.customerSegments[customer.segment].satisfaction - 15);
                    this.addEvent(`✗ Failed withdrawal! Insufficient reserves. Trust decreased!`, 'danger');
                }
            }
        } else {
            if (customer.type === 'withdrawal') {
                this.customerTrust = Math.max(0, this.customerTrust - 5);
                this.customerSegments[customer.segment].satisfaction = Math.max(0, this.customerSegments[customer.segment].satisfaction - 8);
            }
            this.statistics.totals.customersServed++;
            this.addEvent(`Denied ${customer.segment} customer request for $${customer.amount}`, 'warning');
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
            this.statistics.totals.loansIssued++;
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
                this.statistics.totals.loansIssued++;
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
                this.statistics.totals.loanDefaults++;
                this.trackExpense('loanDefaults', loan.principalRemaining);
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
            this.trackRevenue('loanInterest', interestPortion);

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
                this.trackExpense('staffWages', wages);
                if (wages > 100) { // Only log if significant
                    this.addEvent(`Paid staff wages: -$${wages}`, 'info');
                }
            } else {
                // Can't pay wages! Staff quit and trust drops
                const shortage = wages - this.cashReserves;
                this.trackExpense('staffWages', this.cashReserves); // Track what we could pay
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

    calculateWages() {
        // Alias for getStaffWages() - used by crisis events
        return this.getStaffWages();
    }

    findCheapestUpgrade() {
        let cheapest = null;
        let lowestCost = Infinity;

        for (let category in this.technologies) {
            for (let tech of this.technologies[category]) {
                if (tech.level < tech.maxLevel && tech.cost < lowestCost) {
                    cheapest = tech;
                    lowestCost = tech.cost;
                }
            }
        }
        return cheapest;
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

        if (totalReturns > 0) {
            this.trackRevenue('investmentReturns', totalReturns);
            if (totalReturns > 10) {
                this.addEvent(`Investment returns: +$${Math.floor(totalReturns)}`, 'success');
            }
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

    // Interest Rate Management
    processDepositInterest() {
        if (this.customerDeposits > 0) {
            const monthlyRate = this.depositInterestRate / 12;
            const interestPayment = this.customerDeposits * monthlyRate;

            if (this.cashReserves >= interestPayment) {
                this.cashReserves -= interestPayment;
                this.trackExpense('depositInterest', interestPayment);
                this.addEvent(`Paid $${Math.floor(interestPayment)} interest on deposits`, 'info');
            } else {
                // Can't pay interest - major trust hit!
                this.customerTrust = Math.max(0, this.customerTrust - 20);
                this.addEvent(`💥 CRISIS: Can't pay deposit interest! Trust plummeted!`, 'danger');
            }
        }
    }

    updateMarketRates() {
        // Market rates evolve with the era
        const eraRates = {
            'roaring20s': { deposit: 0.02, loan: 0.06 },
            'depression': { deposit: 0.01, loan: 0.08 },
            'wartime': { deposit: 0.015, loan: 0.05 },
            'postwar': { deposit: 0.025, loan: 0.06 },
            'modern': { deposit: 0.03, loan: 0.07 },
            'digital': { deposit: 0.02, loan: 0.05 },
            'fintech': { deposit: 0.015, loan: 0.04 },
            'future': { deposit: 0.01, loan: 0.03 }
        };

        const baseRates = eraRates[this.era.id] || { deposit: 0.02, loan: 0.06 };

        // Add some randomness (±0.5%)
        this.marketRates.deposit = baseRates.deposit + (Math.random() - 0.5) * 0.005;
        this.marketRates.loan = baseRates.loan + (Math.random() - 0.5) * 0.005;
    }

    getCustomerAttraction() {
        // Returns true if our rates are competitive
        const depositAdvantage = this.depositInterestRate >= this.marketRates.deposit - 0.005;
        const loanAdvantage = this.loanBaseRate <= this.marketRates.loan + 0.005;
        return depositAdvantage && loanAdvantage;
    }

    updateInterestRate(type, value) {
        value = parseFloat(value);
        if (type === 'deposit') {
            this.depositInterestRate = value;
        } else if (type === 'loan') {
            this.loanBaseRate = value;
        }
        this.renderInterestRates();
    }

    renderInterestRates() {
        // Update UI displays
        const depositSlider = document.getElementById('depositInterestRate');
        const loanSlider = document.getElementById('loanInterestRate');
        const depositDisplay = document.getElementById('depositRateDisplay');
        const loanDisplay = document.getElementById('loanRateDisplay');
        const marketDepositDisplay = document.getElementById('marketDepositRate');
        const marketLoanDisplay = document.getElementById('marketLoanRate');

        if (depositSlider) depositSlider.value = this.depositInterestRate;
        if (loanSlider) loanSlider.value = this.loanBaseRate;
        if (depositDisplay) depositDisplay.textContent = `${(this.depositInterestRate * 100).toFixed(2)}%`;
        if (loanDisplay) loanDisplay.textContent = `${(this.loanBaseRate * 100).toFixed(2)}%`;
        if (marketDepositDisplay) marketDepositDisplay.textContent = `${(this.marketRates.deposit * 100).toFixed(2)}%`;
        if (marketLoanDisplay) marketLoanDisplay.textContent = `${(this.marketRates.loan * 100).toFixed(2)}%`;
    }

    // Competitor Banks Display
    updateCompetitorsDisplay() {
        const competitorsBody = document.getElementById('competitorsTableBody');
        if (!competitorsBody) return;

        // Update market share display
        const marketShareElem = document.getElementById('yourMarketShare');
        if (marketShareElem) {
            marketShareElem.textContent = `${this.marketShare.toFixed(1)}%`;
            // Color code based on market share
            if (this.marketShare >= 50) {
                marketShareElem.style.color = '#44ff44'; // Green
            } else if (this.marketShare >= 30) {
                marketShareElem.style.color = '#ffaa00'; // Orange
            } else {
                marketShareElem.style.color = '#ff4444'; // Red
            }
        }

        let html = `
            <tr class="market-leader">
                <td>🏦 ${this.bankName || 'Your Bank'}</td>
                <td>$${Math.floor(this.customerDeposits)}</td>
                <td>${(this.depositInterestRate * 100).toFixed(2)}%</td>
                <td>${(this.loanBaseRate * 100).toFixed(2)}%</td>
                <td>${this.marketShare.toFixed(1)}%</td>
            </tr>
        `;

        this.competitors.forEach(comp => {
            html += `
                <tr>
                    <td>🏦 ${comp.name}</td>
                    <td>$${Math.floor(comp.deposits)}</td>
                    <td>${(comp.depositRate * 100).toFixed(2)}%</td>
                    <td>${(comp.loanRate * 100).toFixed(2)}%</td>
                    <td>${comp.marketShare.toFixed(1)}%</td>
                </tr>
            `;
        });

        competitorsBody.innerHTML = html;
    }

    // Economic Indicators Display
    updateEconomyDisplay() {
        const inflationElem = document.getElementById('inflationRate');
        const unemploymentElem = document.getElementById('unemploymentRate');
        const gdpElem = document.getElementById('gdpGrowth');
        const stockElem = document.getElementById('stockMarketIndex');
        const confidenceElem = document.getElementById('consumerConfidence');

        if (inflationElem) inflationElem.textContent = `${(this.economy.inflation * 100).toFixed(1)}%`;
        if (unemploymentElem) unemploymentElem.textContent = `${(this.economy.unemployment * 100).toFixed(1)}%`;
        if (gdpElem) gdpElem.textContent = `${(this.economy.gdpGrowth * 100).toFixed(1)}%`;
        if (stockElem) stockElem.textContent = Math.floor(this.economy.stockMarketIndex);
        if (confidenceElem) confidenceElem.textContent = `${Math.floor(this.economy.consumerConfidence)}`;
    }

    // Branches Display
    updateBranchesDisplay() {
        const branchesBody = document.getElementById('branchesTableBody');
        if (!branchesBody) return;

        let html = '';
        this.branches.forEach(branch => {
            if (!branch.unlocked) return;

            html += `
                <tr>
                    <td>${branch.name}</td>
                    <td>${branch.location}</td>
                    <td>${branch.customers}</td>
                    <td>$${Math.floor(branch.deposits)}</td>
                    <td>👤 ${branch.staff.tellers} | 💂 ${branch.staff.guards}</td>
                    <td>Level ${branch.level}</td>
                </tr>
            `;
        });

        branchesBody.innerHTML = html;
    }

    // Financial Products Display
    updateProductsDisplay() {
        const productsBody = document.getElementById('productsTableBody');
        if (!productsBody) return;

        let html = '';
        for (const [key, product] of Object.entries(this.products)) {
            if (!product.unlocked) continue;

            const productName = this.getProductName(key);
            const revenue = product.customers * product.profitMargin * 100; // Monthly revenue estimate

            html += `
                <tr>
                    <td>${productName}</td>
                    <td>${product.customers}</td>
                    <td>${(product.profitMargin * 100).toFixed(1)}%</td>
                    <td>$${Math.floor(revenue)}/mo</td>
                </tr>
            `;
        }

        if (html === '') {
            html = '<tr><td colspan="4" style="text-align: center; font-style: italic;">No products unlocked yet</td></tr>';
        }

        productsBody.innerHTML = html;
    }

    // Random Events System
    processRandomEvent() {
        // Check for historical crises first (these take priority)
        this.checkHistoricalCrises();

        // Don't trigger if we have an active event or triggered one recently
        if (this.activeEvent) return;
        const monthsSinceLastEvent = this.currentYear * 12 + this.currentMonth - this.lastEventMonth;
        if (monthsSinceLastEvent < 6) return; // At least 6 months between events

        // 15% chance per month for an event
        if (Math.random() < 0.15) {
            this.triggerRandomEvent();
        }
    }

    checkHistoricalCrises() {
        // Check if we're at the right date for a historical crisis
        if (this.activeEvent) return; // Don't override active events

        // 1929 Stock Market Crash - October 1929
        if (this.currentYear === 1929 && this.currentMonth === 10 && !this.historicalCrises.crash1929) {
            this.historicalCrises.crash1929 = true;
            this.triggerCrisisEvent('crash1929');
            return;
        }

        // 1933 Bank Holiday - March 1933
        if (this.currentYear === 1933 && this.currentMonth === 3 && !this.historicalCrises.bankHoliday1933) {
            this.historicalCrises.bankHoliday1933 = true;
            this.triggerCrisisEvent('bankHoliday1933');
            return;
        }

        // 1973 Oil Crisis - October 1973
        if (this.currentYear === 1973 && this.currentMonth === 10 && !this.historicalCrises.oilCrisis1973) {
            this.historicalCrises.oilCrisis1973 = true;
            this.triggerCrisisEvent('oilCrisis1973');
            return;
        }

        // 2008 Financial Crisis - September 2008
        if (this.currentYear === 2008 && this.currentMonth === 9 && !this.historicalCrises.financialCrisis2008) {
            this.historicalCrises.financialCrisis2008 = true;
            this.triggerCrisisEvent('financialCrisis2008');
            return;
        }

        // COVID-19 Pandemic - March 2020
        if (this.currentYear === 2020 && this.currentMonth === 3 && !this.historicalCrises.covidPandemic2020) {
            this.historicalCrises.covidPandemic2020 = true;
            this.triggerCrisisEvent('covidPandemic2020');
            return;
        }
    }

    triggerRandomEvent() {
        const events = this.getAvailableEvents();
        if (events.length === 0) return;

        const event = events[Math.floor(Math.random() * events.length)];
        this.activeEvent = event;
        this.lastEventMonth = this.currentYear * 12 + this.currentMonth;

        this.displayEvent(event);
    }

    triggerCrisisEvent(crisisId) {
        const crisisEvents = this.getCrisisEvents();
        const event = crisisEvents.find(e => e.id === crisisId);
        if (!event) return;

        this.activeEvent = event;
        this.lastEventMonth = this.currentYear * 12 + this.currentMonth;
        this.addEvent(`🚨 MAJOR EVENT: ${event.title}`, 'danger');
        this.displayEvent(event);
    }

    getCrisisEvents() {
        return [
            // 1929 Stock Market Crash
            {
                id: 'crash1929',
                title: '💥 BLACK TUESDAY - 1929 STOCK MARKET CRASH',
                description: 'The stock market has collapsed! Panic sweeps the nation as stock values plummet 50%. Customers are rushing to withdraw their deposits. Your stock investments have crashed. This is the worst financial disaster in history.',
                type: 'crisis',
                historical: true,
                choices: [
                    {
                        text: 'Sell investments at massive loss to meet withdrawals',
                        effect: () => {
                            // Lose 50% of stock investments
                            const stockLoss = Math.floor(this.investments.stocks * 0.5);
                            const speculativeLoss = Math.floor(this.investments.speculative * 0.75);
                            this.investments.stocks = Math.floor(this.investments.stocks * 0.5);
                            this.investments.speculative = Math.floor(this.investments.speculative * 0.25);

                            // 40% of customers try to withdraw
                            const withdrawalDemand = Math.floor(this.customerDeposits * 0.4);
                            const actualWithdrawals = Math.min(withdrawalDemand, this.cashReserves);
                            this.cashReserves -= actualWithdrawals;
                            this.customerDeposits -= actualWithdrawals;
                            this.activeAccounts = Math.floor(this.activeAccounts * 0.6);

                            // Trust hit
                            this.customerTrust = Math.max(20, this.customerTrust - 30);

                            this.trackExpense('marketCrash', stockLoss + speculativeLoss);

                            return `DEVASTATING: Lost $${stockLoss + speculativeLoss} in investments. Paid out $${actualWithdrawals} in withdrawals. Trust: -30. 40% of customers left.`;
                        }
                    },
                    {
                        text: 'Hold investments & limit withdrawals (risky!)',
                        effect: () => {
                            // Keep investments but take smaller loss
                            const stockLoss = Math.floor(this.investments.stocks * 0.3);
                            this.investments.stocks = Math.floor(this.investments.stocks * 0.7);
                            this.investments.speculative = Math.floor(this.investments.speculative * 0.4);

                            // Can only pay limited withdrawals
                            const withdrawalDemand = Math.floor(this.customerDeposits * 0.4);
                            const actualWithdrawals = Math.min(withdrawalDemand * 0.5, this.cashReserves);
                            this.cashReserves -= actualWithdrawals;
                            this.customerDeposits -= actualWithdrawals;

                            // MASSIVE trust hit for denying withdrawals
                            this.customerTrust = Math.max(10, this.customerTrust - 50);
                            this.activeAccounts = Math.floor(this.activeAccounts * 0.5);

                            this.trackExpense('marketCrash', stockLoss);

                            return `BANK RUN: Denied half of withdrawals. Lost $${stockLoss}. Trust: -50! 50% of customers left. Reputation severely damaged.`;
                        }
                    },
                    {
                        text: 'Emergency: Raise deposit rates to keep customers',
                        effect: () => {
                            // Moderate investment loss
                            const stockLoss = Math.floor(this.investments.stocks * 0.4);
                            this.investments.stocks = Math.floor(this.investments.stocks * 0.6);
                            this.investments.speculative = Math.floor(this.investments.speculative * 0.5);

                            // Raise rates dramatically
                            this.depositInterestRate = Math.min(0.15, this.depositInterestRate * 2);

                            // Fewer withdrawals
                            const withdrawalDemand = Math.floor(this.customerDeposits * 0.25);
                            const actualWithdrawals = Math.min(withdrawalDemand, this.cashReserves);
                            this.cashReserves -= actualWithdrawals;
                            this.customerDeposits -= actualWithdrawals;
                            this.activeAccounts = Math.floor(this.activeAccounts * 0.75);

                            // Medium trust hit
                            this.customerTrust = Math.max(30, this.customerTrust - 20);

                            this.trackExpense('marketCrash', stockLoss);

                            return `COSTLY SURVIVAL: Lost $${stockLoss} in investments. Doubled deposit rates to ${(this.depositInterestRate * 100).toFixed(2)}%. Paid $${actualWithdrawals}. Trust: -20. 25% of customers left. High ongoing costs!`;
                        }
                    }
                ]
            },

            // 1933 Bank Holiday
            {
                id: 'bankHoliday1933',
                title: '🏛️ BANK HOLIDAY - Government Shuts Down All Banks',
                description: 'President Roosevelt has declared a national "Bank Holiday" - ALL banks must close immediately for 1 week while the government inspects them. You cannot operate, earn revenue, or serve customers, but you must still pay expenses.',
                type: 'crisis',
                historical: true,
                choices: [
                    {
                        text: 'Comply fully with government orders',
                        effect: () => {
                            // Pay 1 month of wages with no revenue
                            const wages = this.calculateWages();
                            this.cashReserves -= wages;

                            // Government inspection boosts trust afterward
                            this.customerTrust = Math.min(100, this.customerTrust + 25);

                            // Eligible for government support
                            const governmentAid = Math.floor(wages * 1.5);
                            this.cashReserves += governmentAid;

                            this.trackExpense('bankHoliday', wages);

                            return `COMPLIANT: Paid $${wages} in expenses with no revenue. Government provided $${governmentAid} in aid. Trust +25 for cooperation. Bank passes inspection!`;
                        }
                    },
                    {
                        text: 'Operate secretly (illegal but profitable)',
                        effect: () => {
                            if (Math.random() < 0.6) {
                                // Caught!
                                const fine = Math.floor(this.cashReserves * 0.3);
                                this.cashReserves -= fine;
                                this.customerTrust = Math.max(0, this.customerTrust - 40);

                                return `CAUGHT: Fined $${fine} for illegal operation! Trust -40. Federal investigation ongoing. Reputation destroyed!`;
                            } else {
                                // Got away with it
                                const secretProfit = Math.floor(this.customerDeposits * 0.02);
                                this.cashReserves += secretProfit;
                                this.customerTrust -= 10;

                                return `RISKY SUCCESS: Earned $${secretProfit} during closure. Trust -10 from rumors. Living dangerously!`;
                            }
                        }
                    },
                    {
                        text: 'Use closure to restructure operations',
                        effect: () => {
                            // Pay wages but improve efficiency
                            const wages = this.calculateWages();
                            this.cashReserves -= wages;

                            // Get efficiency boost
                            const cheapestTech = this.findCheapestUpgrade();
                            if (cheapestTech) {
                                cheapestTech.level++;
                                this.recalculateStats();
                            }

                            this.customerTrust += 10;
                            this.trackExpense('bankHoliday', wages);

                            return `STRATEGIC: Paid $${wages} but used time wisely. Upgraded operations. Trust +10. Emerged stronger!`;
                        }
                    }
                ]
            },

            // 1973 Oil Crisis
            {
                id: 'oilCrisis1973',
                title: '⛽ OIL CRISIS - Energy Prices Skyrocket',
                description: 'OPEC has imposed an oil embargo! Gas prices quadruple overnight. Inflation spikes to 12%. The economy is in "stagflation" - high inflation + recession. Interest rates must rise dramatically or your bank will hemorrhage money.',
                type: 'crisis',
                historical: true,
                choices: [
                    {
                        text: 'Raise ALL interest rates aggressively',
                        effect: () => {
                            // Match inflation
                            this.depositInterestRate = Math.min(0.12, this.depositInterestRate + 0.06);
                            this.loanBaseRate = Math.min(0.18, this.loanBaseRate + 0.08);

                            // Spike inflation
                            this.economy.inflation = 0.12;

                            // Keep customers but reduce activity
                            this.customerTrust = Math.max(40, this.customerTrust - 10);

                            // Operating costs increase
                            const inflationCost = Math.floor(this.cashReserves * 0.08);
                            this.cashReserves -= inflationCost;

                            this.trackExpense('oilCrisis', inflationCost);

                            return `INFLATION DEFENSE: Deposit rate now ${(this.depositInterestRate * 100).toFixed(1)}%, Loan rate ${(this.loanBaseRate * 100).toFixed(1)}%. Lost $${inflationCost} to inflation. Trust -10. Staying competitive!`;
                        }
                    },
                    {
                        text: 'Keep rates low (lose to inflation)',
                        effect: () => {
                            // Don't adjust rates
                            this.economy.inflation = 0.12;

                            // Massive real value loss
                            const inflationLoss = Math.floor((this.cashReserves + this.customerDeposits) * 0.12);
                            this.cashReserves -= Math.floor(inflationLoss * 0.6);

                            // Customers flee to competitors
                            this.customerDeposits = Math.floor(this.customerDeposits * 0.7);
                            this.activeAccounts = Math.floor(this.activeAccounts * 0.7);
                            this.customerTrust = Math.max(20, this.customerTrust - 35);

                            this.trackExpense('oilCrisis', Math.floor(inflationLoss * 0.6));

                            return `CRUSHED: Lost $${Math.floor(inflationLoss * 0.6)} to inflation! 30% of customers moved to banks with better rates. Trust -35. Money is losing value daily!`;
                        }
                    },
                    {
                        text: 'Focus on short-term loans with variable rates',
                        effect: () => {
                            // Moderate rate increase
                            this.depositInterestRate = Math.min(0.10, this.depositInterestRate + 0.04);
                            this.loanBaseRate = Math.min(0.15, this.loanBaseRate + 0.06);
                            this.economy.inflation = 0.12;

                            // Benefit from higher loan rates
                            const loanProfit = Math.floor(this.customerDeposits * 0.05);
                            this.cashReserves += loanProfit;

                            // Smaller customer loss
                            this.customerDeposits = Math.floor(this.customerDeposits * 0.85);
                            this.activeAccounts = Math.floor(this.activeAccounts * 0.85);

                            this.trackRevenue('oilCrisisLoans', loanProfit);

                            return `ADAPTIVE: Profit from crisis! Earned $${loanProfit} on variable-rate loans. Lost 15% of depositors. Rates at ${(this.depositInterestRate * 100).toFixed(1)}/${(this.loanBaseRate * 100).toFixed(1)}%.`;
                        }
                    }
                ]
            },

            // 2008 Financial Crisis
            {
                id: 'financialCrisis2008',
                title: '🏚️ 2008 FINANCIAL CRISIS - Housing Market Collapse',
                description: 'Lehman Brothers has collapsed! The housing bubble has burst. Mortgage-backed securities are worthless. Unemployment is spiking. Loan defaults are at 35% and rising. The government is offering bailouts, but accepting comes with strings attached.',
                type: 'crisis',
                historical: true,
                choices: [
                    {
                        text: 'Accept government bailout (TARP funds)',
                        effect: () => {
                            // Get huge cash injection
                            const bailout = Math.floor(this.customerDeposits * 0.5);
                            this.cashReserves += bailout;

                            // But massive reputation hit
                            this.customerTrust = Math.max(30, this.customerTrust - 35);

                            // Loan defaults still happen
                            const defaultedLoans = Math.floor(this.loans.length * 0.35);
                            for (let i = 0; i < defaultedLoans && this.loans.length > 0; i++) {
                                const loan = this.loans[this.loans.length - 1];
                                this.cashReserves -= loan.principalRemaining;
                                this.trackExpense('housingCrisis', loan.principalRemaining);
                                this.loans.pop();
                                this.totalLoanDefaults++;
                            }

                            return `BAILOUT: Received $${bailout} from government. Trust -35 ("Too Big To Fail"). ${defaultedLoans} loans defaulted. Public outrage! Survived but tainted.`;
                        }
                    },
                    {
                        text: 'Refuse bailout - handle crisis independently',
                        effect: () => {
                            // Heavy loan defaults
                            const defaultedLoans = Math.floor(this.loans.length * 0.4);
                            let totalLoss = 0;
                            for (let i = 0; i < defaultedLoans && this.loans.length > 0; i++) {
                                const loan = this.loans[this.loans.length - 1];
                                totalLoss += loan.principalRemaining;
                                this.loans.pop();
                                this.totalLoanDefaults++;
                            }
                            this.cashReserves -= totalLoss;

                            if (this.cashReserves < 0) {
                                this.cashReserves = 100; // Near bankruptcy
                                this.customerTrust = 20;
                                this.trackExpense('housingCrisis', totalLoss);
                                return `NEAR DEATH: Lost $${totalLoss} on defaults. Nearly bankrupt! But maintained independence. Rebuilding from ruins.`;
                            } else {
                                // Gain respect for independence
                                this.customerTrust = Math.min(100, this.customerTrust + 20);
                                this.trackExpense('housingCrisis', totalLoss);
                                return `INDEPENDENT: Lost $${totalLoss} but stayed solvent! Trust +20 for refusing bailout. Earned respect for resilience!`;
                            }
                        }
                    },
                    {
                        text: 'Aggressively liquidate assets & fortify',
                        effect: () => {
                            // Sell all investments at discount
                            const liquidatedFunds = Math.floor((this.investments.bonds + this.investments.stocks + this.investments.speculative) * 0.7);
                            this.cashReserves += liquidatedFunds;
                            this.investments.bonds = 0;
                            this.investments.stocks = 0;
                            this.investments.speculative = 0;

                            // Moderate loan defaults
                            const defaultedLoans = Math.floor(this.loans.length * 0.25);
                            let totalLoss = 0;
                            for (let i = 0; i < defaultedLoans && this.loans.length > 0; i++) {
                                const loan = this.loans[this.loans.length - 1];
                                totalLoss += loan.principalRemaining;
                                this.loans.pop();
                                this.totalLoanDefaults++;
                            }
                            this.cashReserves -= totalLoss;

                            // Trust from stability
                            this.customerTrust = Math.min(100, this.customerTrust + 10);

                            this.trackExpense('housingCrisis', totalLoss);

                            return `DEFENSIVE: Liquidated investments for $${liquidatedFunds}. Lost $${totalLoss} on ${defaultedLoans} defaults. Trust +10. Cash-heavy and defensive!`;
                        }
                    }
                ]
            },

            // COVID-19 Pandemic
            {
                id: 'covidPandemic2020',
                title: '🦠 COVID-19 PANDEMIC - Global Lockdown',
                description: 'A deadly pandemic has shut down the global economy! Lockdowns are in effect. Physical branches are empty. Unemployment spikes to 15%. However, online banking is surging. Government is offering emergency loans with favorable terms.',
                type: 'crisis',
                historical: true,
                choices: [
                    {
                        text: 'Pivot to digital-first banking',
                        effect: () => {
                            // Check if online banking tech unlocked
                            const hasOnlineTech = this.technologies.efficiency.some(t =>
                                (t.id === 'online' || t.id === 'mobile') && t.level > 0
                            );

                            if (hasOnlineTech) {
                                // Huge advantage!
                                const digitalBonus = Math.floor(this.customerDeposits * 0.15);
                                this.cashReserves += digitalBonus;
                                this.activeAccounts = Math.floor(this.activeAccounts * 1.2);
                                this.customerTrust = Math.min(100, this.customerTrust + 25);

                                this.trackRevenue('covidDigital', digitalBonus);

                                return `DIGITAL SUCCESS: Online banking saves you! Gained $${digitalBonus} and +20% customers. Trust +25. Perfect timing for tech investment!`;
                            } else {
                                // Scramble to adapt
                                const adaptCost = 5000;
                                this.cashReserves -= adaptCost;
                                this.activeAccounts = Math.floor(this.activeAccounts * 0.9);

                                this.trackExpense('covidAdapt', adaptCost);

                                return `SCRAMBLING: Spent $${adaptCost} on emergency digital infrastructure. Lost 10% of customers who couldn't adapt. Need online banking tech!`;
                            }
                        }
                    },
                    {
                        text: 'Issue PPP loans (government-backed stimulus)',
                        effect: () => {
                            // Government backing means no defaults
                            const pppLoans = Math.floor(this.customerDeposits * 0.3);
                            this.cashReserves += pppLoans;

                            // Interest from government
                            const interest = Math.floor(pppLoans * 0.05);
                            this.cashReserves += interest;

                            // Good PR
                            this.customerTrust = Math.min(100, this.customerTrust + 15);

                            this.trackRevenue('pppLoans', pppLoans + interest);

                            return `COMMUNITY HERO: Issued $${pppLoans} in PPP loans, earned $${interest} in fees. Trust +15. Helped local businesses survive!`;
                        }
                    },
                    {
                        text: 'Reduce operations & weather the storm',
                        effect: () => {
                            // Cut costs
                            const layoffs = Math.floor((this.staff.tellers + this.staff.loanOfficers) * 0.3);
                            this.staff.tellers = Math.floor(this.staff.tellers * 0.7);
                            this.staff.loanOfficers = Math.floor(this.staff.loanOfficers * 0.7);

                            // Lose customers but save money
                            this.activeAccounts = Math.floor(this.activeAccounts * 0.75);
                            this.customerDeposits = Math.floor(this.customerDeposits * 0.75);
                            this.customerTrust = Math.max(30, this.customerTrust - 20);

                            const savings = layoffs * 50;

                            return `SURVIVAL MODE: Laid off ${layoffs} staff, saved $${savings}/month. Lost 25% of customers. Trust -20. Hibernating until recovery.`;
                        }
                    }
                ]
            }
        ];
    }

    getAvailableEvents() {
        // Event pool with era-specific events
        const allEvents = [
            // Economic Events
            {
                id: 'market_boom',
                title: '📈 Market Boom!',
                description: 'The economy is booming! Investment returns are soaring.',
                type: 'economic',
                minYear: 1920,
                choices: [
                    {
                        text: 'Invest heavily in the market',
                        effect: () => {
                            const investAmount = Math.floor(this.cashReserves * 0.3);
                            if (investAmount > 0) {
                                this.cashReserves -= investAmount;
                                this.investments.stocks += investAmount;
                                return `Invested $${investAmount} in stocks. Returns doubled for 6 months!`;
                            }
                            return 'Not enough cash to invest.';
                        }
                    },
                    {
                        text: 'Play it safe',
                        effect: () => {
                            this.customerTrust = Math.min(100, this.customerTrust + 5);
                            return 'Customers appreciate your conservative approach. Trust +5';
                        }
                    }
                ]
            },
            {
                id: 'recession',
                title: '📉 Economic Downturn',
                description: 'A recession is hitting hard. Customers are nervous.',
                type: 'economic',
                minYear: 1920,
                choices: [
                    {
                        text: 'Lower interest rates to attract deposits',
                        effect: () => {
                            this.depositInterestRate *= 1.5;
                            this.customerTrust = Math.min(100, this.customerTrust + 10);
                            return 'Deposit rate increased. Trust +10, but higher costs!';
                        }
                    },
                    {
                        text: 'Tighten lending standards',
                        effect: () => {
                            this.automation.loanOfficers.autoApproveMediumRisk = false;
                            this.automation.loanOfficers.autoApproveHighRisk = false;
                            return 'Stricter lending reduces risk during tough times.';
                        }
                    }
                ]
            },
            {
                id: 'tech_breakthrough',
                title: '💡 Technology Breakthrough',
                description: 'A new banking technology is available at a discount!',
                type: 'opportunity',
                minYear: 1950,
                choices: [
                    {
                        text: 'Invest in the technology',
                        effect: () => {
                            // Find cheapest unmax tech and upgrade it
                            let upgraded = false;
                            for (let category in this.technologies) {
                                for (let tech of this.technologies[category]) {
                                    if (tech.level < tech.maxLevel) {
                                        tech.level++;
                                        upgraded = true;
                                        this.recalculateStats();
                                        return `Upgraded ${tech.name} for free!`;
                                    }
                                }
                            }
                            return upgraded ? 'Technology upgraded!' : 'All tech already maxed!';
                        }
                    },
                    {
                        text: 'Decline the offer',
                        effect: () => {
                            this.cashReserves += 1000;
                            return 'Received $1000 consultation fee instead.';
                        }
                    }
                ]
            },
            {
                id: 'vip_opportunity',
                title: '⭐ VIP Client Opportunity',
                description: 'A wealthy individual wants to bank with you exclusively.',
                type: 'opportunity',
                minYear: 1930,
                choices: [
                    {
                        text: 'Accept (requires premium service)',
                        effect: () => {
                            if (this.staff.managers >= 1) {
                                this.customerSegments.vip.count += 3;
                                this.cashReserves += 20000;
                                return 'VIP client secured! +$20,000 and 3 VIP customers!';
                            }
                            return 'Need at least 1 manager for VIP service!';
                        }
                    },
                    {
                        text: 'Decline',
                        effect: () => {
                            return 'Passed on the opportunity.';
                        }
                    }
                ]
            },
            {
                id: 'regulatory_audit',
                title: '🏛️ Regulatory Audit',
                description: 'Government auditors are reviewing your bank operations.',
                type: 'regulatory',
                minYear: 1933,
                choices: [
                    {
                        text: 'Full cooperation',
                        effect: () => {
                            const cost = Math.floor(this.cashReserves * 0.05);
                            this.cashReserves -= cost;
                            this.customerTrust = Math.min(100, this.customerTrust + 15);
                            return `Audit cost $${cost}, but trust increased significantly!`;
                        }
                    },
                    {
                        text: 'Minimal compliance',
                        effect: () => {
                            if (Math.random() < 0.3) {
                                const fine = Math.floor(this.cashReserves * 0.15);
                                this.cashReserves -= fine;
                                return `Fined $${fine} for non-compliance!`;
                            }
                            return 'Passed audit with minimal effort.';
                        }
                    }
                ]
            },
            {
                id: 'cyber_attack',
                title: '🔒 Cybersecurity Threat',
                description: 'Hackers are targeting banks in your area!',
                type: 'crisis',
                minYear: 2000,
                choices: [
                    {
                        text: 'Emergency security upgrade',
                        effect: () => {
                            const cost = 5000;
                            if (this.cashReserves >= cost) {
                                this.cashReserves -= cost;
                                return `Spent $${cost} on security. Attack prevented!`;
                            }
                            const loss = Math.floor(this.cashReserves * 0.2);
                            this.cashReserves -= loss;
                            return `Couldn't afford security. Lost $${loss} to breach!`;
                        }
                    },
                    {
                        text: 'Trust existing security',
                        effect: () => {
                            if (this.getSecurityProtection() > 150) {
                                return 'Your security systems held strong!';
                            }
                            const loss = Math.floor(this.cashReserves * 0.1);
                            this.cashReserves -= loss;
                            this.customerTrust = Math.max(0, this.customerTrust - 10);
                            return `Security breach! Lost $${loss} and trust decreased.`;
                        }
                    }
                ]
            }
        ];

        // Filter events by year and era
        return allEvents.filter(e => this.currentYear >= e.minYear);
    }

    handleEventChoice(choiceIndex) {
        if (!this.activeEvent) return;

        const choice = this.activeEvent.choices[choiceIndex];
        const result = choice.effect();

        this.eventHistory.push({
            ...this.activeEvent,
            choice: choice.text,
            result: result,
            date: `${this.monthNames[this.currentMonth - 1]} ${this.currentYear}`
        });

        this.addEvent(`Event: ${this.activeEvent.title} - ${result}`, 'info');

        this.activeEvent = null;
        this.hideEvent();
        this.updateDisplay();
    }

    displayEvent(event) {
        const modal = document.getElementById('eventModal');
        const title = document.getElementById('eventTitle');
        const description = document.getElementById('eventDescription');
        const choicesDiv = document.getElementById('eventChoices');

        title.textContent = event.title;
        description.textContent = event.description;

        choicesDiv.innerHTML = '';
        event.choices.forEach((choice, index) => {
            const button = document.createElement('button');
            button.className = 'event-choice-btn';
            button.textContent = choice.text;
            button.onclick = () => this.handleEventChoice(index);
            choicesDiv.appendChild(button);
        });

        modal.style.display = 'flex';
    }

    hideEvent() {
        const modal = document.getElementById('eventModal');
        if (modal) modal.style.display = 'none';
    }

    recalculateStats() {
        this.securityLevel = this.calculateSecurityLevel();
        this.profitMultiplier = this.calculateProfitMultiplier();
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

        // Update customer segments display
        document.getElementById('retailCount').textContent = this.customerSegments.retail.count;
        document.getElementById('retailDeposits').textContent = Math.floor(this.customerSegments.retail.deposits);
        document.getElementById('businessCount').textContent = this.customerSegments.business.count;
        document.getElementById('businessDeposits').textContent = Math.floor(this.customerSegments.business.deposits);
        document.getElementById('vipCount').textContent = this.customerSegments.vip.count;
        document.getElementById('vipDeposits').textContent = Math.floor(this.customerSegments.vip.deposits);

        // Update interest rates display
        this.renderInterestRates();

        // Update new features display
        this.updateCompetitorsDisplay();
        this.updateEconomyDisplay();
        this.updateBranchesDisplay();
        this.updateProductsDisplay();

        // Update statistics if panel is open
        if (this.showStatistics) {
            this.renderStatistics();
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

    toggleCompetitors() {
        this.showCompetitors = !this.showCompetitors;
        const panel = document.getElementById('competitorsPanel');
        const btn = document.getElementById('toggleCompetitorsBtn');

        if (this.showCompetitors) {
            panel.style.display = 'block';
            btn.classList.add('active');
            this.updateCompetitorsDisplay();
        } else {
            panel.style.display = 'none';
            btn.classList.remove('active');
        }
    }

    toggleEconomy() {
        this.showEconomy = !this.showEconomy;
        const panel = document.getElementById('economyPanel');
        const btn = document.getElementById('toggleEconomyBtn');

        if (this.showEconomy) {
            panel.style.display = 'block';
            btn.classList.add('active');
            this.updateEconomyDisplay();
        } else {
            panel.style.display = 'none';
            btn.classList.remove('active');
        }
    }

    toggleBranches() {
        this.showBranches = !this.showBranches;
        const panel = document.getElementById('branchesPanel');
        const btn = document.getElementById('toggleBranchesBtn');

        if (this.showBranches) {
            panel.style.display = 'block';
            btn.classList.add('active');
            this.updateBranchesDisplay();
        } else {
            panel.style.display = 'none';
            btn.classList.remove('active');
        }
    }

    toggleProducts() {
        this.showProducts = !this.showProducts;
        const panel = document.getElementById('productsPanel');
        const btn = document.getElementById('toggleProductsBtn');

        if (this.showProducts) {
            panel.style.display = 'block';
            btn.classList.add('active');
            this.updateProductsDisplay();
        } else {
            panel.style.display = 'none';
            btn.classList.remove('active');
        }
    }

    // P&L Tracking Methods
    trackRevenue(type, amount) {
        if (amount <= 0) return;

        this.statistics.currentMonth.revenue[type] += amount;
        this.statistics.currentMonth.revenue.total += amount;
        this.statistics.totals.totalRevenueAllTime += amount;
    }

    trackExpense(type, amount) {
        if (amount <= 0) return;

        this.statistics.currentMonth.expenses[type] += amount;
        this.statistics.currentMonth.expenses.total += amount;
        this.statistics.totals.totalExpensesAllTime += amount;
    }

    calculateMonthlyPnL() {
        // Calculate net income for the month
        this.statistics.currentMonth.netIncome =
            this.statistics.currentMonth.revenue.total -
            this.statistics.currentMonth.expenses.total;

        // Limit history to last 120 months (10 years) - trim oldest if at limit
        const maxHistory = 120;
        if (this.statistics.history.monthly.revenue.length >= maxHistory) {
            this.statistics.history.monthly.revenue.shift();
            this.statistics.history.monthly.expenses.shift();
            this.statistics.history.monthly.netIncome.shift();
            this.statistics.history.monthly.loanInterestIncome.shift();
            this.statistics.history.monthly.investmentReturns.shift();
            this.statistics.history.monthly.productRevenue.shift();
            this.statistics.history.monthly.depositInterestExpense.shift();
            this.statistics.history.monthly.wageExpense.shift();
            this.statistics.history.monthly.defaultExpense.shift();
            this.statistics.history.monthly.timestamps.shift();
        }

        // Record in history
        this.statistics.history.monthly.revenue.push(this.statistics.currentMonth.revenue.total);
        this.statistics.history.monthly.expenses.push(this.statistics.currentMonth.expenses.total);
        this.statistics.history.monthly.netIncome.push(this.statistics.currentMonth.netIncome);
        this.statistics.history.monthly.loanInterestIncome.push(this.statistics.currentMonth.revenue.loanInterest);
        this.statistics.history.monthly.investmentReturns.push(this.statistics.currentMonth.revenue.investmentReturns);
        this.statistics.history.monthly.productRevenue.push(this.statistics.currentMonth.revenue.productRevenue);
        this.statistics.history.monthly.depositInterestExpense.push(this.statistics.currentMonth.expenses.depositInterest);
        this.statistics.history.monthly.wageExpense.push(this.statistics.currentMonth.expenses.staffWages);
        this.statistics.history.monthly.defaultExpense.push(this.statistics.currentMonth.expenses.loanDefaults);
        this.statistics.history.monthly.timestamps.push({
            month: this.currentMonth,
            year: this.currentYear
        });

        // Update total profit
        this.statistics.totals.totalProfitAllTime += this.statistics.currentMonth.netIncome;

        // Reset for next month
        this.statistics.currentMonth = {
            revenue: {
                loanInterest: 0,
                investmentReturns: 0,
                productRevenue: 0,
                fees: 0,
                total: 0
            },
            expenses: {
                depositInterest: 0,
                staffWages: 0,
                loanDefaults: 0,
                robberyLosses: 0,
                techUpgrades: 0,
                operationalCosts: 0,
                total: 0
            },
            netIncome: 0
        };
    }

    calculateFinancialMetrics() {
        // Calculate key financial ratios and metrics
        const totalAssets = this.cashReserves + this.investments.bonds +
                           this.investments.stocks + this.investments.speculative;
        const equity = totalAssets - this.customerDeposits;
        const totalEmployees = this.staff.tellers + this.staff.loanOfficers +
                              this.staff.guards + this.staff.managers;

        // Return on Assets (ROA)
        if (totalAssets > 0) {
            this.statistics.analytics.returnOnAssets =
                (this.totalProfit / totalAssets * 100).toFixed(2);
        }

        // Return on Equity (ROE)
        if (equity > 0) {
            this.statistics.analytics.returnOnEquity =
                (this.totalProfit / equity * 100).toFixed(2);
        }

        // Net Interest Margin
        const interestIncome = (this.statistics.history.monthly?.loanInterestIncome || []).slice(-12).reduce((a, b) => a + b, 0);
        const interestExpense = (this.statistics.history.monthly?.depositInterestExpense || []).slice(-12).reduce((a, b) => a + b, 0);
        if (totalAssets > 0) {
            this.statistics.analytics.netInterestMargin =
                ((interestIncome - interestExpense) / totalAssets * 100).toFixed(2);
        }

        // Efficiency Ratio (lower is better)
        const recentRevenue = (this.statistics.history.monthly?.revenue || []).slice(-12).reduce((a, b) => a + b, 0);
        const recentExpenses = (this.statistics.history.monthly?.expenses || []).slice(-12).reduce((a, b) => a + b, 0);
        if (recentRevenue > 0) {
            this.statistics.analytics.efficiencyRatio =
                (recentExpenses / recentRevenue * 100).toFixed(2);
        }

        // Revenue per Employee
        if (totalEmployees > 0) {
            this.statistics.analytics.revenuePerEmployee =
                Math.floor(recentRevenue / totalEmployees);
        }

        // Profit per Customer
        if (this.activeAccounts > 0) {
            const recentProfit = (this.statistics.history.monthly?.netIncome || []).slice(-12).reduce((a, b) => a + b, 0);
            this.statistics.analytics.profitPerCustomer =
                Math.floor(recentProfit / this.activeAccounts);
        }

        // Average deposit size
        if (this.activeAccounts > 0) {
            this.statistics.analytics.averageDepositSize =
                Math.floor(this.customerDeposits / this.activeAccounts);
        }

        // Average loan size
        if (this.totalLoansIssued > 0 && this.loans.length > 0) {
            const totalLoanValue = this.loans.reduce((sum, loan) => sum + loan.amount, 0);
            this.statistics.analytics.averageLoanSize =
                Math.floor(totalLoanValue / this.loans.length);
        }

        // Loan default rate
        if (this.statistics.totals.loansIssued > 0) {
            this.statistics.analytics.loanDefaultRate =
                (this.statistics.totals.loanDefaults / this.statistics.totals.loansIssued * 100).toFixed(2);
        }
    }

    renderStatistics() {
        // Calculate current metrics
        this.calculateFinancialMetrics();

        // Update stat totals
        document.getElementById('statCustomersServed').textContent = this.statistics.totals.customersServed;
        document.getElementById('statDepositsProcessed').textContent = this.statistics.totals.depositsProcessed;
        document.getElementById('statWithdrawalsProcessed').textContent = this.statistics.totals.withdrawalsProcessed;
        document.getElementById('statLoansIssued').textContent = this.statistics.totals.loansIssued;
        document.getElementById('statLoanDefaults').textContent = this.statistics.totals.loanDefaults;
        document.getElementById('statRobberiesPrevented').textContent = this.statistics.totals.robberiesPrevented;
        document.getElementById('statRobberiesSucceeded').textContent = this.statistics.totals.robberiesSucceeded;

        // Update P&L Summary (with safety checks)
        const monthlyRevenue = (this.statistics.history.monthly?.revenue || []).slice(-12).reduce((a, b) => a + b, 0);
        const monthlyExpenses = (this.statistics.history.monthly?.expenses || []).slice(-12).reduce((a, b) => a + b, 0);
        const monthlyProfit = (this.statistics.history.monthly?.netIncome || []).slice(-12).reduce((a, b) => a + b, 0);

        const elem1 = document.getElementById('totalRevenueL12M');
        const elem2 = document.getElementById('totalExpensesL12M');
        const elem3 = document.getElementById('netIncomeL12M');
        const elem4 = document.getElementById('totalRevenueAllTime');
        const elem5 = document.getElementById('totalExpensesAllTime');
        const elem6 = document.getElementById('netIncomeAllTime');

        if (elem1) elem1.textContent = `$${Math.floor(monthlyRevenue)}`;
        if (elem2) elem2.textContent = `$${Math.floor(monthlyExpenses)}`;
        if (elem3) elem3.textContent = `$${Math.floor(monthlyProfit)}`;
        if (elem4) elem4.textContent = `$${Math.floor(this.statistics.totals.totalRevenueAllTime || 0)}`;
        if (elem5) elem5.textContent = `$${Math.floor(this.statistics.totals.totalExpensesAllTime || 0)}`;
        if (elem6) elem6.textContent = `$${Math.floor(this.statistics.totals.totalProfitAllTime || 0)}`;

        // Update Revenue Breakdown
        const recentLoanInterest = (this.statistics.history.monthly?.loanInterestIncome || []).slice(-12).reduce((a, b) => a + b, 0);
        const recentInvestments = (this.statistics.history.monthly?.investmentReturns || []).slice(-12).reduce((a, b) => a + b, 0);
        const recentProducts = (this.statistics.history.monthly?.productRevenue || []).slice(-12).reduce((a, b) => a + b, 0);

        const elem7 = document.getElementById('revenueLoanInterest');
        const elem8 = document.getElementById('revenueInvestments');
        const elem9 = document.getElementById('revenueProducts');

        if (elem7) elem7.textContent = `$${Math.floor(recentLoanInterest)}`;
        if (elem8) elem8.textContent = `$${Math.floor(recentInvestments)}`;
        if (elem9) elem9.textContent = `$${Math.floor(recentProducts)}`;

        // Update Expense Breakdown
        const recentDepositInterest = (this.statistics.history.monthly?.depositInterestExpense || []).slice(-12).reduce((a, b) => a + b, 0);
        const recentWages = (this.statistics.history.monthly?.wageExpense || []).slice(-12).reduce((a, b) => a + b, 0);
        const recentDefaults = (this.statistics.history.monthly?.defaultExpense || []).slice(-12).reduce((a, b) => a + b, 0);

        const elem10 = document.getElementById('expenseDepositInterest');
        const elem11 = document.getElementById('expenseWages');
        const elem12 = document.getElementById('expenseDefaults');

        if (elem10) elem10.textContent = `$${Math.floor(recentDepositInterest)}`;
        if (elem11) elem11.textContent = `$${Math.floor(recentWages)}`;
        if (elem12) elem12.textContent = `$${Math.floor(recentDefaults)}`;

        // Update Financial Metrics
        const elem13 = document.getElementById('metricROA');
        const elem14 = document.getElementById('metricROE');
        const elem15 = document.getElementById('metricNIM');
        const elem16 = document.getElementById('metricEfficiency');
        const elem17 = document.getElementById('metricRevenuePerEmployee');
        const elem18 = document.getElementById('metricProfitPerCustomer');
        const elem19 = document.getElementById('metricAvgDeposit');
        const elem20 = document.getElementById('metricAvgLoan');
        const elem21 = document.getElementById('metricDefaultRate');

        if (elem13) elem13.textContent = `${this.statistics.analytics.returnOnAssets || 0}%`;
        if (elem14) elem14.textContent = `${this.statistics.analytics.returnOnEquity || 0}%`;
        if (elem15) elem15.textContent = `${this.statistics.analytics.netInterestMargin || 0}%`;
        if (elem16) elem16.textContent = `${this.statistics.analytics.efficiencyRatio || 0}%`;
        if (elem17) elem17.textContent = `$${this.statistics.analytics.revenuePerEmployee || 0}`;
        if (elem18) elem18.textContent = `$${this.statistics.analytics.profitPerCustomer || 0}`;
        if (elem19) elem19.textContent = `$${this.statistics.analytics.averageDepositSize || 0}`;
        if (elem20) elem20.textContent = `$${this.statistics.analytics.averageLoanSize || 0}`;
        if (elem21) elem21.textContent = `${this.statistics.analytics.loanDefaultRate || 0}%`;

        // Render charts (with safety checks)
        this.renderChart('cashChart', this.statistics.history.cash || [], 'Cash Reserves', '#44ff44');
        this.renderChart('depositsChart', this.statistics.history.deposits || [], 'Customer Deposits', '#00aaff');
        this.renderChart('profitChart', this.statistics.history.monthly?.netIncome || [], 'Monthly Net Income', '#ffaa00');
        this.renderChart('accountsChart', this.statistics.history.accounts || [], 'Active Accounts', '#ff44ff');
        this.renderChart('revenueChart', this.statistics.history.monthly?.revenue || [], 'Monthly Revenue', '#44ff44');
        this.renderChart('expensesChart', this.statistics.history.monthly?.expenses || [], 'Monthly Expenses', '#ff4444');
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
