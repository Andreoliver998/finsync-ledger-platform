/**
 * Lightweight typedefs used across the app (JSDoc for editor IntelliSense).
 *
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {string} [createdAt]
 *
 * @typedef {'INCOME'|'EXPENSE'|'TRANSFER'|'UNKNOWN'} TransactionKind
 *
 * @typedef {Object} Transaction
 * @property {string} id
 * @property {string} description
 * @property {number} amount
 * @property {string} date  ISO string
 * @property {string} [category]
 * @property {string} [merchant]
 * @property {string} [bank]
 * @property {string} [paymentMethod]
 * @property {string} [source]   MANUAL | OPEN_FINANCE | CSV_IMPORT | ONEDRIVE_CSV | LEDGER
 * @property {TransactionKind} [kind]
 *
 * @typedef {Object} DashboardSummary
 * @property {number} balance
 * @property {number} income
 * @property {number} expenses
 * @property {number} [savings]
 * @property {Array<{category:string, total:number}>} [byCategory]
 * @property {Transaction[]} [recentTransactions]
 *
 * @typedef {Object} FinancialProfile
 * @property {string} [archetype]
 * @property {string[]} [highlights]
 * @property {Array<{label:string, value:string|number}>} [metrics]
 * @property {string[]} [recommendations]
 */

export {};
