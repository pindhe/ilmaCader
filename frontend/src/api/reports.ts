import { api, unwrapData } from '@/api/client'

export async function getFinanceSummary(familyId: string) {
  const { data } = await api.get('/reports/finance-summary/', {
    params: { family: familyId },
  })
  return unwrapData<Record<string, unknown>>(data)
}

export async function getMemberSummary(familyId: string) {
  const { data } = await api.get('/reports/member-summary/', {
    params: { family: familyId },
  })
  return unwrapData<Record<string, unknown>>(data)
}
