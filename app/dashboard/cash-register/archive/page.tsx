'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function ArchivePage() {
  const [business, setBusiness] = useState<any>(null)
  const [archivedRegisters, setArchivedRegisters] = useState<any[]>([])
  const [filteredArchived, setFilteredArchived] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const router = useRouter()
  const { toast } = useToast()

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

      // Get user's staff role
      const { data: staffData } = await supabase
        .from('staff')
        .select('role')
        .eq('user_id', user.id)
        .eq('business_id', businessData?.id)
        .single()

      setUserRole(staffData?.role || null)

      if (businessData) {
        // Fetch archived register closings
        const { data: closings } = await supabase
          .from('register_closings')
          .select(`*`)
          .eq('business_id', businessData.id)
          .eq('is_archived', true)
          .order('closing_time', { ascending: false })

        // Fetch staff info for each closing
        const closingsWithStaff = await Promise.all(
          (closings || []).map(async (closing) => {
            const { data: staffInfo } = await supabase
              .from('staff')
              .select('id, first_name, last_name')
              .eq('id', closing.closed_by)
              .single()
            return {
              ...closing,
              staff: staffInfo,
            }
          })
        )

        setArchivedRegisters(closingsWithStaff)
        setFilteredArchived(closingsWithStaff)
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const applyDateFilter = (registers: any[]) => {
    let filtered = registers

    if (startDate) {
      const start = new Date(startDate)
      filtered = filtered.filter((r) => new Date(r.closing_time) >= start)
    }

    if (endDate) {
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      filtered = filtered.filter((r) => new Date(r.closing_time) <= end)
    }

    setFilteredArchived(filtered)
  }

  const handleUnarchive = async (registerId: string) => {
    if (userRole !== 'admin' && userRole !== 'manager') {
      toast({
        title: 'Permission Denied',
        description: 'Only admins and managers can unarchive register history',
        variant: 'destructive',
      })
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('register_closings')
        .update({ is_archived: false })
        .eq('id', registerId)

      if (error) throw error

      // Refresh list
      const { data: closings } = await supabase
        .from('register_closings')
        .select(`*`)
        .eq('business_id', business.id)
        .eq('is_archived', true)
        .order('closing_time', { ascending: false })

      const closingsWithStaff = await Promise.all(
        (closings || []).map(async (closing) => {
          const { data: staffInfo } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('id', closing.closed_by)
            .single()
          return {
            ...closing,
            staff: staffInfo,
          }
        })
      )

      setArchivedRegisters(closingsWithStaff)

      toast({
        title: 'Restored',
        description: 'Register history has been restored to active history',
      })
    } catch (error) {
      console.error('[v0] Error unarchiving register:', error)
      toast({
        title: 'Error',
        description: 'Failed to restore register history',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading archived register history...</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Archived Register History</h1>
          <p className="text-muted-foreground mt-1">View and manage archived cash register sessions</p>
        </div>
      </div>

      {/* Date Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value)
                  applyDateFilter(archivedRegisters)
                }}
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value)
                  applyDateFilter(archivedRegisters)
                }}
              />
            </div>
            {(startDate || endDate) && (
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStartDate('')
                    setEndDate('')
                    applyDateFilter(archivedRegisters)
                  }}
                >
                  Clear Filter
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Archived Sessions ({filteredArchived.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredArchived.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No archived register sessions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredArchived.map((closing) => (
                <div
                  key={closing.id}
                  className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <h3 className="font-semibold">
                          {closing.staff ? `${closing.staff.first_name} ${closing.staff.last_name}` : 'Unknown Staff'}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(closing.closing_time).toLocaleString()}
                      </p>
                    </div>
                    {(userRole === 'admin' || userRole === 'manager') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnarchive(closing.id)}
                      >
                        Restore
                      </Button>
                    )}
                  </div>

                  <button
                    onClick={() => setExpandedId(expandedId === closing.id ? null : closing.id)}
                    className="w-full text-left text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {expandedId === closing.id ? 'Hide Details' : 'View Details'}
                  </button>

                  {expandedId === closing.id && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                      <div>
                        <p className="text-xs text-muted-foreground">Opening Balance</p>
                        <p className="font-semibold">
                          {business?.currency_code} {closing.opening_balance?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Cash Sales</p>
                        <p className="font-semibold">
                          {business?.currency_code} {closing.cash_sales?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Non-Cash Sales</p>
                        <p className="font-semibold">
                          {business?.currency_code} {closing.non_cash_sales?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expenses</p>
                        <p className="font-semibold">
                          {business?.currency_code} {closing.small_expenses?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Expected Cash</p>
                        <p className="font-semibold">
                          {business?.currency_code} {closing.expected_cash?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Actual Cash</p>
                        <p className="font-semibold">
                          {business?.currency_code} {closing.actual_cash?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Variance</p>
                        <p
                          className={`font-semibold ${
                            closing.variance > 0 ? 'text-red-600' : closing.variance < 0 ? 'text-green-600' : ''
                          }`}
                        >
                          {closing.variance > 0 ? '+' : ''}
                          {business?.currency_code} {closing.variance?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      {closing.notes && (
                        <div className="col-span-2 md:col-span-4">
                          <p className="text-xs text-muted-foreground">Notes</p>
                          <p className="text-sm">{closing.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
