'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2, Mail, Phone } from 'lucide-react'
import SupplierForm from '@/components/suppliers/supplier-form'
import { useRouter } from 'next/navigation'

export default function SuppliersPage() {
  const [business, setBusiness] = useState<any>(null)
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: businessData } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .single()

      setBusiness(businessData)

      if (businessData) {
        const { data: suppliersData } = await supabase
          .from('suppliers')
          .select('*')
          .eq('business_id', businessData.id)
          .order('name')

        setSuppliers(suppliersData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const filteredSuppliers = suppliers.filter(
    (supplier) =>
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      supplier.phone?.includes(searchQuery)
  )

  const handleSaveSupplier = async (formData: any) => {
    const supabase = createClient()

    try {
      if (selectedSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update(formData)
          .eq('id', selectedSupplier.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([{ ...formData, business_id: business.id }])

        if (error) throw error
      }

      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('*')
        .eq('business_id', business.id)
        .order('name')

      setSuppliers(suppliersData || [])
      setShowForm(false)
      setSelectedSupplier(null)
    } catch (error) {
      console.error('[v0] Error saving supplier:', error)
      alert('Error saving supplier')
    }
  }

  const handleDeleteSupplier = async (supplierId: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', supplierId)

      if (error) throw error

      setSuppliers(suppliers.filter((s) => s.id !== supplierId))
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert('Error deleting supplier')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Suppliers</h1>
          <p className="text-muted-foreground mt-1">Manage your supplier database</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Supplier
        </Button>
      </div>

      {showForm && (
        <SupplierForm
          supplier={selectedSupplier}
          onSave={handleSaveSupplier}
          onCancel={() => {
            setShowForm(false)
            setSelectedSupplier(null)
          }}
        />
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search suppliers by name, email, or phone..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No suppliers found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Name</th>
                    <th className="px-6 py-3 text-left font-semibold">Contact</th>
                    <th className="px-6 py-3 text-left font-semibold">Address</th>
                    <th className="px-6 py-3 text-left font-semibold">Tax ID</th>
                    <th className="px-6 py-3 text-center font-semibold">Status</th>
                    <th className="px-6 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSuppliers.map((supplier) => (
                    <tr key={supplier.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-3 font-medium">{supplier.name}</td>
                      <td className="px-6 py-3">
                        <div className="space-y-1">
                          {supplier.email && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {supplier.email}
                            </div>
                          )}
                          {supplier.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {supplier.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">
                        {supplier.city && supplier.state
                          ? `${supplier.city}, ${supplier.state}`
                          : supplier.address || '-'}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs">
                        {supplier.tax_id || '-'}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            supplier.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {supplier.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedSupplier(supplier)
                              setShowForm(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteSupplier(supplier.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
