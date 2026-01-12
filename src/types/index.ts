export interface Transaction {
  id: string
  date: Date
  description: string
  accountId: string
  amount: number
  type: 'income' | 'expense'
  createdAt: Date
  updatedAt: Date
}

export interface Account {
  id: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'
  code?: string
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface Report {
  period: string
  totalIncome: number
  totalExpense: number
  netProfit: number
}
