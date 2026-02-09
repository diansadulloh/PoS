'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react'
import RegisterForm from '@/components/cash-register/register-form'
import { useRouter } from 'next/navigation'

export default function CashRegisterPage() {
  const [business, setBusiness] = useState<any>(null)
  const [registers, setRegisters] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [registerToClose, setRegisterToClose] = useState<any>(null)
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
        .maybeSingle()

      setBusiness(businessData)

      if (businessData) {
        const { data: registersData } = await supabase
          .from('cash_registers')
          .select(`
            *,
            staff(first_name, last_name)
          `)
          .eq('business_id', businessData.id)
          .order('opening_time', { ascending: false })

        setRegisters(registersData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Clock className="w-4 h-4 text-green-600" />
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-blue-600" />
      default:
        return <XCircle className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-700'
      case 'closed':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const handleSaveRegister = async (formData: any) => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      if (registerToClose) {
        // Closing an existing register
        const { error } = await supabase
          .from('cash_registers')
          .update({
            closing_balance: formData.closing_balance,
            closing_time: new Date().toISOString(),
            variance: formData.variance,
            notes: formData.notes,
            status: 'closed',
          })
          .eq('id', registerToClose.id)

        if (error) throw error
      } else {
        // Opening a new register
        // First, get staff_id for the current user
        const { data: staffData } = await supabase
          .from('staff')
          .select('id')
          .eq('business_id', business.id)
          .eq('user_id', user.id)
          .single()

        const { error } = await supabase.from('cash_registers').insert([
          {
            business_id: business.id,
            staff_id: staffData?.id,
            register_name: formData.register_name,
            opening_balance: formData.opening_balance,
            opening_time: new Date().toISOString(),
            status: 'open',
            notes: formData.notes,
          },
        ])

        if (error) throw error
      }

      // Refresh register list
      const { data: registersData } = await supabase
        .from('cash_registers')
        .select(`
            *,
            staff(first_name, last_name)
          `)
        .eq('business_id', business.id)
        .order('opening_time', { ascending: false })

      setRegisters(registersData || [])
      setShowForm(false)
      setRegisterToClose(null)
    } catch (error) {
      console.error('[v0] Error saving register:', error)
      alert('Error saving register')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold">No Business Profile</h2>
          <p className="text-muted-foreground">
            {'You need to create a business profile before managing cash registers.'}
          </p>
          <button
            onClick={() => router.push('/dashboard/settings')}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            Create Business Profile
          </button>
        </div>
      </div>
    )
  }

  const openRegisters = registers.filter((r) => r.status === 'open')
  const closedRegisters = registers.filter((r) => r.status === 'closed')

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cash Register</h1>
          <p className="text-muted-foreground mt-1">Manage cash register operations and cash up</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Open Register
        </Button>
      </div>

      {showForm && (
        <RegisterForm
          registerToClose={registerToClose}
          onSave={handleSaveRegister}
          onCancel={() => {
            setShowForm(false)
            setRegisterToClose(null)
          }}
        />
      )}

      {/* Open Registers */}
      {openRegisters.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Open Registers</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openRegisters.map((register) => (
              <Card key={register.id} className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center justify-between">
                    <span>{register.register_name || 'Register'}</span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${getStatusColor(register.status)}`}
                    >
                      {getStatusIcon(register.status)}
                      Open
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Cashier:</span>
                    <span className="font-medium">
                      {register.staff
                        ? `${register.staff.first_name} ${register.staff.last_name}`
                        : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Opened:</span>
                    <span className="font-medium">
                      {new Date(register.opening_time).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">Opening Balance:</span>
                    <span className="font-semibold">
                      {business.currency_code} {register.opening_balance?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <Button
                    className="w-full mt-2 bg-transparent"
                    variant="outline"
                    onClick={() => {
                      setRegisterToClose(register)
                      setShowForm(true)
                    }}
                  >
                    Close Register
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Recent Closed Registers */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Register History</h2>
        <Card>
          <CardContent className="p-0">
            {closedRegisters.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No closed register sessions found</p>
                <p className="text-sm mt-2">
                  {'Open a register to start tracking cash operations'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold">Register</th>
                      <th className="px-6 py-3 text-left font-semibold">Cashier</th>
                      <th className="px-6 py-3 text-left font-semibold">Date</th>
                      <th className="px-6 py-3 text-right font-semibold">Opening</th>
                      <th className="px-6 py-3 text-right font-semibold">Closing</th>
                      <th className="px-6 py-3 text-right font-semibold">Variance</th>
                      <th className="px-6 py-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {closedRegisters.map((register) => {
                      const variance = register.variance || 0
                      const varianceColor =
                        variance > 0
                          ? 'text-red-600'
                          : variance < 0
                            ? 'text-green-600'
                            : 'text-gray-600'

                      return (
                        <tr key={register.id} className="border-b hover:bg-muted/50">
                          <td className="px-6 py-3 font-medium">
                            {register.register_name || 'Register'}
                          </td>
                          <td className="px-6 py-3">
                            {register.staff
                              ? `${register.staff.first_name} ${register.staff.last_name}`
                              : '-'}
                          </td>
                          <td className="px-6 py-3 text-muted-foreground">
                            {new Date(register.opening_time).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {business.currency_code} {register.opening_balance?.toFixed(2) || '0.00'}
                          </td>
                          <td className="px-6 py-3 text-right">
                            {business.currency_code} {register.closing_balance?.toFixed(2) || '0.00'}
                          </td>
                          <td className={`px-6 py-3 text-right font-semibold ${varianceColor}`}>
                            {variance !== 0 && (variance > 0 ? '+' : '')}
                            {business.currency_code} {variance.toFixed(2)}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${getStatusColor(register.status)}`}
                            >
                              {getStatusIcon(register.status)}
                              {register.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
