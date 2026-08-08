import { api, unwrapData, unwrapList } from '@/api/client'
import type {
  Asset,
  Budget,
  Contribution,
  Debt,
  Expense,
  FinancialGoal,
  Income,
  SavingGoal,
} from '@/types'

function familyParams(familyId: string) {
  return { params: { family: familyId } }
}

export async function listIncome(familyId: string) {
  const { data } = await api.get('/income/', familyParams(familyId))
  return unwrapList<Income>(data)
}

export async function createIncome(
  payload: Partial<Income> & { family: string; title: string; amount: number | string; date: string },
) {
  const { data } = await api.post('/income/', payload)
  return unwrapData<Income>(data)
}

export async function updateIncome(id: string, payload: Partial<Income>) {
  const { data } = await api.patch(`/income/${id}/`, payload)
  return unwrapData<Income>(data)
}

export async function deleteIncome(id: string) {
  await api.delete(`/income/${id}/`)
}

export async function listExpenses(familyId: string) {
  const { data } = await api.get('/expenses/', familyParams(familyId))
  return unwrapList<Expense>(data)
}

export async function createExpense(
  payload: Partial<Expense> & { family: string; title: string; amount: number | string; date: string },
) {
  const { data } = await api.post('/expenses/', payload)
  return unwrapData<Expense>(data)
}

export async function updateExpense(id: string, payload: Partial<Expense>) {
  const { data } = await api.patch(`/expenses/${id}/`, payload)
  return unwrapData<Expense>(data)
}

export async function deleteExpense(id: string) {
  await api.delete(`/expenses/${id}/`)
}

export async function listContributions(familyId: string) {
  const { data } = await api.get('/contributions/', familyParams(familyId))
  return unwrapList<Contribution>(data)
}

export async function createContribution(
  payload: Partial<Contribution> & { family: string; amount: number | string; date: string },
) {
  const { data } = await api.post('/contributions/', payload)
  return unwrapData<Contribution>(data)
}

export async function listSavings(familyId: string) {
  const { data } = await api.get('/savings/', familyParams(familyId))
  return unwrapList<SavingGoal>(data)
}

export async function createSaving(
  payload: Partial<SavingGoal> & { family: string; title: string; target_amount: number | string },
) {
  const { data } = await api.post('/savings/', payload)
  return unwrapData<SavingGoal>(data)
}

export async function listBudgets(familyId: string) {
  const { data } = await api.get('/budgets/', familyParams(familyId))
  return unwrapList<Budget>(data)
}

export async function createBudget(
  payload: Partial<Budget> & { family: string; category: string; amount: number | string; year: number },
) {
  const { data } = await api.post('/budgets/', payload)
  return unwrapData<Budget>(data)
}

export async function listAssets(familyId: string) {
  const { data } = await api.get('/assets/', familyParams(familyId))
  return unwrapList<Asset>(data)
}

export async function createAsset(
  payload: Partial<Asset> & { family: string; name: string; asset_type: string },
) {
  const { data } = await api.post('/assets/', payload)
  return unwrapData<Asset>(data)
}

export async function listDebts(familyId: string) {
  const { data } = await api.get('/debts/', familyParams(familyId))
  return unwrapList<Debt>(data)
}

export async function createDebt(
  payload: Partial<Debt> & {
    family: string
    name: string
    amount: number | string
    remaining_balance: number | string
  },
) {
  const { data } = await api.post('/debts/', payload)
  return unwrapData<Debt>(data)
}

export async function listGoals(familyId: string) {
  const { data } = await api.get('/goals/', familyParams(familyId))
  return unwrapList<FinancialGoal>(data)
}

export async function createGoal(
  payload: Partial<FinancialGoal> & { family: string; name: string; target_amount: number | string },
) {
  const { data } = await api.post('/goals/', payload)
  return unwrapData<FinancialGoal>(data)
}

export async function getFinanceDashboard(familyId: string) {
  const { data } = await api.get('/finance/dashboard/', familyParams(familyId))
  return unwrapData<Record<string, unknown>>(data)
}

export async function getBudgetVsActual(familyId: string, year?: number, month?: number) {
  const { data } = await api.get('/finance/budget-vs-actual/', {
    params: { family: familyId, year, month },
  })
  return unwrapData<Record<string, unknown>>(data)
}
