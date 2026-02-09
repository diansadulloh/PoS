'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2, Mail, Phone } from 'lucide-react'
import CustomerForm from '@/components/customers/customer-form'
import { useRouter } from 'next/navigation'

export default function CustomersPage() {
  const [business, setBusiness] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
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
        const { data: customersData } = await supabase
          .from('customers')
          .select('*')
          .eq('business_id', businessData.id)
          .order('name')

        setCustomers(customersData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery)
  )

  const handleSaveCustomer = async (formData: any) => {
    const supabase = createClient()

    try {
      if (selectedCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(formData)
          .eq('id', selectedCustomer.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('customers')
          .insert([{ ...formData, business_id: business.id }])

        if (error) throw error
      }

      const { data: customersData } = await supabase
        .from('customers')
        .select('*')
        .eq('business_id', business.id)
        .order('name')

      setCustomers(customersData || [])
      setShowForm(false)
      setSelectedCustomer(null)
    } catch (error) {
      console.error('Error saving customer:', error)
      alert('Error saving customer')
    }
  }

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerId)

      if (error) throw error

      setCustomers(customers.filter((c) => c.id !== customerId))
    } catch (error) {
      console.error('Error deleting customer:', error)
      alert('Error deleting customer')
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
          <h1 className="text-3xl font-bold">Customers</h1>
          <p className="text-muted-foreground mt-1">Manage your customer database</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {showForm && (
        <CustomerForm
          customer={selectedCustomer}
          onSave={handleSaveCustomer}
          onCancel={() => {
            setShowForm(false)
            setSelectedCustomer(null)
          }}
        />
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search customers by name, email, or phone..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          {filteredCustomers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No customers found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Name</th>
                    <th className="px-6 py-3 text-left font-semibold">Contact</th>
                    <th className="px-6 py-3 text-left font-semibold">Address</th>
                    <th className="px-6 py-3 text-left font-semibold">Group</th>
                    <th className="px-6 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-3 font-medium">{customer.name}</td>
                      <td className="px-6 py-3">
                        <div className="space-y-1">
                          {customer.email && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {customer.email}
                            </div>
                          )}
                          {customer.phone && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              {customer.phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">
                        {customer.city && customer.state
                          ? `${customer.city}, ${customer.state}`
                          : customer.address || '-'}
                      </td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                          {customer.customer_group}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCustomer(customer)
                              setShowForm(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCustomer(customer.id)}
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
