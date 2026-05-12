// Screens are colocated under src/features/<domain>/screens/.
// This barrel exists to satisfy the documented architecture and can be used
// for cross-feature screen registrations when needed.
export { LoginScreen } from '@features/auth/screens/LoginScreen';
export { RegisterScreen } from '@features/auth/screens/RegisterScreen';
export { AuthLoadingScreen } from '@features/auth/screens/AuthLoadingScreen';
export { DashboardScreen } from '@features/dashboard/screens/DashboardScreen';
export { TransactionsScreen } from '@features/transactions/screens/TransactionsScreen';
export { TransactionDetailsScreen } from '@features/transactions/screens/TransactionDetailsScreen';
export { FinancialSearchScreen } from '@features/search/screens/FinancialSearchScreen';
export { FinancialProfileScreen } from '@features/financialProfile/screens/FinancialProfileScreen';
export { IntelligentReadingScreen } from '@features/intelligentReading/screens/IntelligentReadingScreen';
export { RelationshipGraphScreen } from '@features/relationshipGraph/screens/RelationshipGraphScreen';
export { EntityDetailsScreen } from '@features/analytics/screens/EntityDetailsScreen';
export { RelatedTransactionsScreen } from '@features/analytics/screens/RelatedTransactionsScreen';
export { TimelineAnalysisScreen } from '@features/analytics/screens/TimelineAnalysisScreen';
export { InsightDetailsScreen } from '@features/analytics/screens/InsightDetailsScreen';
export { ExportScreen } from '@features/analytics/screens/ExportScreen';
export { SettingsScreen } from '@features/settings/screens/SettingsScreen';
