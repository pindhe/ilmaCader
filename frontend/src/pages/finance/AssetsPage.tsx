import { createAsset, listAssets } from '@/api/finance'
import { ResourceListPage } from '@/features/finance/ResourceListPage'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { Asset } from '@/types'

export function AssetsPage() {
  return (
    <ResourceListPage<Asset>
      title="Assets"
      description="Property, vehicles, accounts, and investments"
      queryKey="assets"
      queryFn={listAssets}
      createLabel="Add asset"
      onCreate={(familyId, form) =>
        createAsset({
          family: familyId,
          name: form.name,
          asset_type: form.asset_type || 'other',
          current_value: form.current_value || 0,
          purchase_price: form.purchase_price || 0,
          purchase_date: form.purchase_date || null,
          location: form.location,
          description: form.description,
        })
      }
      formFields={[
        { name: 'name', label: 'Name', required: true },
        { name: 'asset_type', label: 'Type', placeholder: 'house, land, car…' },
        { name: 'current_value', label: 'Current value', type: 'number' },
        { name: 'purchase_price', label: 'Purchase price', type: 'number' },
        { name: 'purchase_date', label: 'Purchase date', type: 'date' },
        { name: 'location', label: 'Location' },
        { name: 'description', label: 'Description' },
      ]}
      columns={[
        { key: 'name', header: 'Name', cell: (r) => r.name },
        { key: 'type', header: 'Type', cell: (r) => r.asset_type },
        { key: 'value', header: 'Value', cell: (r) => formatCurrency(r.current_value) },
        { key: 'date', header: 'Purchased', cell: (r) => formatDate(r.purchase_date) },
      ]}
    />
  )
}
