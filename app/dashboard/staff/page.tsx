'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Edit, Trash2, Lock } from 'lucide-react'
import StaffForm from '@/components/staff/staff-form'
import { useRouter } from 'next/navigation'

export default function StaffPage() {
  const [business, setBusiness] = useState<any>(null)
  const [staff, setStaff] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<any>(null)
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
        const { data: staffData } = await supabase
          .from('staff')
          .select('*')
          .eq('business_id', businessData.id)
          .order('first_name')

        setStaff(staffData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const filteredStaff = staff.filter(
    (s) =>
      `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery)
  )

  const handleSaveStaff = async (formData: any) => {
    const supabase = createClient()

    try {
      console.log('[v0] Saving staff with data:', formData)

      if (selectedStaff) {
        const { data, error } = await supabase
          .from('staff')
          .update(formData)
          .eq('id', selectedStaff.id)
          .select()

        console.log('[v0] Staff update response:', { data, error })

        if (error) {
          console.error('[v0] Staff update error - code:', error.code)
          console.error('[v0] Staff update error - message:', error.message)
          console.error('[v0] Staff update error - details:', error.details)
          console.error('[v0] Staff update error - hint:', error.hint)
          throw new Error(error.message || 'Failed to update staff member')
        }
      } else {
        const { data, error } = await supabase
          .from('staff')
          .insert([{ ...formData, business_id: business.id }])
          .select()

        console.log('[v0] Staff insert response:', { data, error })

        if (error) {
          console.error('[v0] Staff insert error - code:', error.code)
          console.error('[v0] Staff insert error - message:', error.message)
          console.error('[v0] Staff insert error - details:', error.details)
          console.error('[v0] Staff insert error - hint:', error.hint)
          throw new Error(error.message || 'Failed to create staff member')
        }
      }

      const { data: staffData } = await supabase
        .from('staff')
        .select('*')
        .eq('business_id', business.id)
        .order('first_name')

      setStaff(staffData || [])
      setShowForm(false)
      setSelectedStaff(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Error saving staff:', errorMessage)
      alert(`Error saving staff member: ${errorMessage}`)
    }
  }

  const handleDeleteStaff = async (staffId: string) => {
    if (!confirm('Are you sure you want to delete this staff member?')) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', staffId)

      if (error) throw error

      setStaff(staff.filter((s) => s.id !== staffId))
    } catch (error) {
      console.error('Error deleting staff:', error)
      alert('Error deleting staff member')
    }
  }

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-red-100 text-red-700',
      manager: 'bg-blue-100 text-blue-700',
      cashier: 'bg-green-100 text-green-700',
      inventory: 'bg-purple-100 text-purple-700',
    }
    return colors[role] || 'bg-gray-100 text-gray-700'
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
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage staff members and their permissions
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Staff Member
        </Button>
      </div>

      {showForm && (
        <StaffForm
          business={business}
          staff={selectedStaff}
          onSave={handleSaveStaff}
          onCancel={() => {
            setShowForm(false)
            setSelectedStaff(null)
          }}
        />
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search staff by name, email, or phone..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Staff Table */}
      <Card>
        <CardContent className="p-0">
          {filteredStaff.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No staff members found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Name</th>
                    <th className="px-6 py-3 text-left font-semibold">Contact</th>
                    <th className="px-6 py-3 text-left font-semibold">Role</th>
                    <th className="px-6 py-3 text-center font-semibold">Status</th>
                    <th className="px-6 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStaff.map((member) => (
                    <tr key={member.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-3 font-medium">
                        {member.first_name} {member.last_name}
                      </td>
                      <td className="px-6 py-3">
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>{member.email}</p>
                          {member.phone && <p>{member.phone}</p>}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span
                          className={`px-3 py-1 text-xs font-semibold rounded-full ${getRoleColor(
                            member.role
                          )}`}
                        >
                          {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            member.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedStaff(member)
                              setShowForm(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteStaff(member.id)}
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

      {/* Role Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Role Permissions Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-sm">Admin</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Full system access</li>
                <li>✓ Manage staff and permissions</li>
                <li>✓ View all reports</li>
                <li>✓ Configure settings</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sm">Manager</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Create sales and invoices</li>
                <li>✓ Manage customers</li>
                <li>✓ View inventory</li>
                <li>✓ Create reports</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sm">Cashier</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Create sales transactions</li>
                <li>✓ View products</li>
                <li>✓ Process payments</li>
                <li>✓ Access cash register</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-sm">Inventory</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Manage products</li>
                <li>✓ Update stock levels</li>
                <li>✓ Process receivings</li>
                <li>✓ Track inventory</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
