'use client'

import { SelectItem } from "@/components/ui/select"
import { SelectContent } from "@/components/ui/select"
import { SelectValue } from "@/components/ui/select"
import { SelectTrigger } from "@/components/ui/select"
import { Select } from "@/components/ui/select"
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Plus, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, Edit2, Loader2 } from 'lucide-react'
import RegisterForm from '@/components/cash-register/register-form'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

export default function CashRegisterPage() {
  const [business, setBusiness] = useState<any>(null)
  const [registers, setRegisters] = useState<any[]>([])
  const [openRegistersState, setOpenRegistersState] = useState<any[]>([])
  const [closedRegistersState, setClosedRegistersState] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [registerToClose, setRegisterToClose] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [showCloseDialog, setShowCloseDialog] = useState(false)
  const [closingAmount, setClosingAmount] = useState('')
  const [closingNotes, setClosingNotes] = useState('')
  const [closingData, setClosingData] = useState<any>(null)
  const [processing, setProcessing] = useState(false)
  const [showEditStaffDialog, setShowEditStaffDialog] = useState(false)
  const [editingRegister, setEditingRegister] = useState<any>(null)
  const [newStaffId, setNewStaffId] = useState('')
  const [staffMembers, setStaffMembers] = useState<any[]>([])
  const [historyPage, setHistoryPage] = useState(0)
  const [displayedHistory, setDisplayedHistory] = useState<any[]>([])
  const [selectedRegisters, setSelectedRegisters] = useState<Set<string>>(new Set())
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const [filteredClosedRegisters, setFilteredClosedRegisters] = useState<any[]>([])
  const router = useRouter()
  const { toast } = useToast()
  
  const HISTORY_PAGE_SIZE = 10

  const setOpenRegisters = (registers: any[]) => {
    setOpenRegistersState(registers)
  }

  const setClosedRegisters = (registers: any[]) => {
    setClosedRegistersState(registers)
    applyDateFilter(registers)
  }

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
    
    setFilteredClosedRegisters(filtered)
    setHistoryPage(0)
    setSelectedRegisters(new Set())
    
    // Update displayed history with pagination
    const start = 0
    const end = start + HISTORY_PAGE_SIZE
    setDisplayedHistory(filtered.slice(start, end))
  }

  const handleSelectRegister = (registerId: string) => {
    const newSelected = new Set(selectedRegisters)
    if (newSelected.has(registerId)) {
      newSelected.delete(registerId)
    } else {
      newSelected.add(registerId)
    }
    setSelectedRegisters(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedRegisters.size === displayedHistory.length) {
      setSelectedRegisters(new Set())
    } else {
      setSelectedRegisters(new Set(displayedHistory.map((r) => r.id)))
    }
  }

  const handleBulkArchive = async () => {
    if (selectedRegisters.size === 0 || (userRole !== 'admin' && userRole !== 'manager')) {
      toast({
        title: 'Permission Denied',
        description: 'Only admins and managers can archive register history',
        variant: 'destructive',
      })
      return
    }

    setProcessing(true)
    const supabase = createClient()

    try {
      const selectedIds = Array.from(selectedRegisters)
      
      // Archive all selected registers
      const { error } = await supabase
        .from('register_closings')
        .update({ is_archived: true })
        .in('id', selectedIds)

      if (error) throw error

      // Refresh register list
      const { data: registersData } = await supabase
        .from('cash_registers')
        .select(`*`)
        .eq('business_id', business.id)
        .order('opening_time', { ascending: false })

      const registersWithStaff = await Promise.all(
        (registersData || []).map(async (register) => {
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('id', register.staff_id)
            .single()
          return {
            ...register,
            staff: staffData,
          }
        })
      )

      setRegisters(registersWithStaff)
      const closed = registersWithStaff.filter((r) => r.status === 'closed')
      setClosedRegisters(closed)
      setSelectedRegisters(new Set())

      toast({
        title: 'Archived',
        description: `${selectedIds.length} register history records have been archived`,
      })
    } catch (error) {
      console.error('[v0] Error archiving registers:', error)
      toast({
        title: 'Error',
        description: 'Failed to archive register history',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleArchiveRegister = async (registerId: string) => {
    // Check if user is admin or manager
    if (userRole !== 'admin' && userRole !== 'manager') {
      toast({
        title: 'Permission Denied',
        description: 'Only admins and managers can archive register history',
        variant: 'destructive',
      })
      return
    }

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('register_closings')
        .update({ is_archived: true })
        .eq('id', registerId)

      if (error) throw error

      // Refresh register list
      const { data: registersData } = await supabase
        .from('cash_registers')
        .select(`*`)
        .eq('business_id', business.id)
        .order('opening_time', { ascending: false })

      const registersWithStaff = await Promise.all(
        (registersData || []).map(async (register) => {
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('id', register.staff_id)
            .single()
          return {
            ...register,
            staff: staffData,
          }
        })
      )

      setRegisters(registersWithStaff)
      const closed = registersWithStaff.filter((r) => r.status === 'closed')
      setClosedRegisters(closed)

      toast({
        title: 'Archived',
        description: 'Register history has been archived',
      })
    } catch (error) {
      console.error('[v0] Error archiving register:', error)
      toast({
        title: 'Error',
        description: 'Failed to archive register history',
        variant: 'destructive',
      })
    }
  }

  const handleNextPage = () => {
    const newPage = historyPage + 1
    const start = newPage * HISTORY_PAGE_SIZE
    if (start < filteredClosedRegisters.length) {
      setHistoryPage(newPage)
      const end = start + HISTORY_PAGE_SIZE
      setDisplayedHistory(filteredClosedRegisters.slice(start, end))
      setSelectedRegisters(new Set())
    }
  }

  const handlePrevPage = () => {
    if (historyPage > 0) {
      const newPage = historyPage - 1
      setHistoryPage(newPage)
      const start = newPage * HISTORY_PAGE_SIZE
      const end = start + HISTORY_PAGE_SIZE
      setDisplayedHistory(filteredClosedRegisters.slice(start, end))
      setSelectedRegisters(new Set())
    }
  }

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

      setUser(user)

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
        // Fetch staff members for the business
        const { data: staff } = await supabase
          .from('staff')
          .select('id, first_name, last_name')
          .eq('business_id', businessData.id)
          .order('first_name')

        setStaffMembers(staff || [])

        const { data: registersData } = await supabase
          .from('cash_registers')
          .select(`*`)
          .eq('business_id', businessData.id)
          .order('opening_time', { ascending: false })

        // Fetch staff info for each register
        const registersWithStaff = await Promise.all(
          (registersData || []).map(async (register) => {
            const { data: staffData } = await supabase
              .from('staff')
              .select('id, first_name, last_name')
              .eq('id', register.staff_id)
              .single()
            return {
              ...register,
              staff: staffData,
            }
          })
        )

        setRegisters(registersWithStaff)
        setOpenRegisters(registersWithStaff.filter((r) => r.status === 'open'))
        setClosedRegisters(registersWithStaff.filter((r) => r.status === 'closed'))

        // Fetch closing summaries for closed registers
        if (registersWithStaff.filter((r) => r.status === 'closed').length > 0) {
          const { data: closingSummaries } = await supabase
            .from('register_closings')
            .select(`*`)
            .in('cash_register_id', registersWithStaff.filter((r) => r.status === 'closed').map((r) => r.id))
            .order('closing_time', { ascending: false })

          // Merge closing data with registers
          const closedWithSummaries = registersWithStaff.filter((r) => r.status === 'closed').map((register) => {
            const summary = closingSummaries?.find((s) => s.cash_register_id === register.id)
            return {
              ...register,
              closing_balance: summary?.actual_cash,
              variance: summary?.variance,
              cash_sales: summary?.cash_sales,
              non_cash_sales: summary?.non_cash_sales,
              small_expenses: summary?.small_expenses,
            }
          })
          setClosedRegisters(closedWithSummaries)
        }
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

  const handleOpenCloseDialog = async (register: any) => {
    const supabase = createClient()

    try {
      // Check if current user created this register or is admin
      if (register.staff_id !== user?.id && userRole !== 'admin') {
        const currentStaff = staffMembers.find((s) => s.id === register.staff_id)
        throw new Error(
          `Only ${currentStaff?.first_name} ${currentStaff?.last_name} or admins can close this register`
        )
      }

      // Get staff record for current user
      const { data: staffData } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', business.id)
        .single()

      // Get sales for this register since opening
      const { data: salesData } = await supabase
        .from('sales')
        .select('payment_method, total_amount')
        .gte('created_at', register.opening_time)

      const cashSales = (salesData || [])
        .filter((s) => s.payment_method === 'cash')
        .reduce((sum, s) => sum + s.total_amount, 0)

      const nonCashSales = (salesData || [])
        .filter((s) => s.payment_method !== 'cash')
        .reduce((sum, s) => sum + s.total_amount, 0)

      // Get small expenses for this register
      const { data: expensesData } = await supabase
        .from('cash_register_expenses')
        .select('amount')
        .eq('cash_register_id', register.id)

      const smallExpenses = (expensesData || []).reduce((sum, e) => sum + e.amount, 0)

      const expectedCash = register.opening_balance + cashSales - smallExpenses

      setClosingData({
        register,
        staffData,
        cashSales,
        nonCashSales,
        smallExpenses,
        expectedCash,
      })

      setShowCloseDialog(true)
    } catch (error) {
      console.error('[v0] Error preparing close dialog:', error)
      toast({
        title: 'Error',
        description: 'Failed to prepare closing summary',
        variant: 'destructive',
      })
    }
  }

  const handleOpenEditStaffDialog = (register: any) => {
    setEditingRegister(register)
    setNewStaffId(register.assigned_staff_id || '')
    setShowEditStaffDialog(true)
  }

  const handleConfirmEditStaff = async () => {
    if (!editingRegister || !newStaffId) return

    setProcessing(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('cash_registers')
        .update({ assigned_staff_id: newStaffId })
        .eq('id', editingRegister.id)

      if (error) throw error

      // Refresh register list
      const { data: registersData } = await supabase
        .from('cash_registers')
        .select(`*`)
        .eq('business_id', business.id)
        .order('opening_time', { ascending: false })

      // Fetch staff info for each register
      const registersWithStaff = await Promise.all(
        (registersData || []).map(async (register) => {
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('id', register.staff_id)
            .single()
          return {
            ...register,
            staff: staffData,
          }
        })
      )

      setRegisters(registersWithStaff)

      // Separate open and closed registers
      const open = registersWithStaff.filter((r) => r.status === 'open')
      const closed = registersWithStaff.filter((r) => r.status === 'closed')
      setOpenRegisters(open)
      setClosedRegisters(closed)

      setShowEditStaffDialog(false)
      setEditingRegister(null)
      setNewStaffId('')

      toast({
        title: 'Register Updated',
        description: 'Staff assignment has been updated successfully',
      })
    } catch (error) {
      console.error('[v0] Error updating register:', error)
      toast({
        title: 'Error',
        description: 'Failed to update register',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleConfirmClose = async () => {
    if (!closingData || !closingAmount) return

    setProcessing(true)
    const supabase = createClient()

    try {
      const actualCash = parseFloat(closingAmount)
      const variance = actualCash - closingData.expectedCash

      // Create register closing record
      const { error: closingError } = await supabase
        .from('register_closings')
        .insert([
          {
            business_id: business.id,
            cash_register_id: closingData.register.id,
            opened_by: closingData.register.assigned_staff_id,
            closed_by: closingData.staffData.id,
            opening_time: closingData.register.opening_time,
            closing_time: new Date().toISOString(),
            opening_balance: closingData.register.opening_balance,
            cash_sales: closingData.cashSales,
            non_cash_sales: closingData.nonCashSales,
            small_expenses: closingData.smallExpenses,
            expected_cash: closingData.expectedCash,
            actual_cash: actualCash,
            variance,
            notes: closingNotes,
          },
        ])

      if (closingError) throw closingError

      // Update cash register status
      const { error: updateError } = await supabase
        .from('cash_registers')
        .update({ status: 'closed' })
        .eq('id', closingData.register.id)

      if (updateError) throw updateError

      // Show success toast immediately
      toast({
        title: 'Register Closed',
        description: `Closing summary created. Variance: ${variance > 0 ? '+' : ''}${variance.toFixed(2)}`,
      })

      // Reset form immediately for better UX
      setShowCloseDialog(false)
      setClosingAmount('')
      setClosingNotes('')
      setClosingData(null)

      // Wait a moment then refresh register list
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Refresh register list with all data including closing summaries
      const { data: registersData } = await supabase
        .from('cash_registers')
        .select(`*`)
        .eq('business_id', business.id)
        .order('opening_time', { ascending: false })

      // Fetch staff info for each register
      const registersWithStaff = await Promise.all(
        (registersData || []).map(async (register) => {
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('id', register.staff_id)
            .single()
          return {
            ...register,
            staff: staffData,
          }
        })
      )

      setRegisters(registersWithStaff)

      // Separate open and closed registers
      const open = registersWithStaff.filter((r) => r.status === 'open')
      const closed = registersWithStaff.filter((r) => r.status === 'closed')
      setOpenRegisters(open)
      setClosedRegisters(closed)

      // Fetch closing summaries for closed registers
      if (closed.length > 0) {
        const { data: closingSummaries } = await supabase
          .from('register_closings')
          .select(`*`)
          .in('cash_register_id', closed.map((r) => r.id))
          .order('closing_time', { ascending: false })

        // Merge closing data with registers
        const closedWithSummaries = closed.map((register) => {
          const summary = closingSummaries?.find((s) => s.cash_register_id === register.id)
          return {
            ...register,
            closing_balance: summary?.actual_cash,
            variance: summary?.variance,
            cash_sales: summary?.cash_sales,
            non_cash_sales: summary?.non_cash_sales,
            small_expenses: summary?.small_expenses,
          }
        })
        setClosedRegisters(closedWithSummaries)
      }

      // Reset pagination and filters
      setHistoryPage(0)
      setStartDate('')
      setEndDate('')
      applyDateFilter(closed)
      setSelectedRegisters(new Set())
    } catch (error) {
      console.error('[v0] Error closing register:', error)
      toast({
        title: 'Error',
        description: 'Failed to close register',
        variant: 'destructive',
      })
    } finally {
      setProcessing(false)
    }
  }

  const handleSaveRegister = async (formData: any) => {
    const supabase = createClient()

    try {
      // Get current user's staff ID
      const { data: currentStaffData } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', business.id)
        .single()

      // Create register with current user as the creator
      const { error } = await supabase.from('cash_registers').insert([
        {
          business_id: business.id,
          staff_id: currentStaffData?.id,
          assigned_staff_id: currentStaffData?.id,
          register_name: formData.register_name,
          opening_balance: parseFloat(formData.opening_balance) || 0,
          opening_time: new Date().toISOString(),
          status: 'open',
        },
      ])

      if (error) throw error

      // Refresh register list
      const { data: registersData } = await supabase
        .from('cash_registers')
        .select(`*`)
        .eq('business_id', business.id)
        .order('opening_time', { ascending: false })

      // Fetch staff info for each register
      const registersWithStaff = await Promise.all(
        (registersData || []).map(async (register) => {
          const { data: staffData } = await supabase
            .from('staff')
            .select('id, first_name, last_name')
            .eq('id', register.staff_id)
            .single()
          return {
            ...register,
            staff: staffData,
          }
        })
      )

      setRegisters(registersWithStaff)
      setOpenRegisters(registersWithStaff.filter((r) => r.status === 'open'))
      setClosedRegisters(registersWithStaff.filter((r) => r.status === 'closed'))
      setShowForm(false)

      toast({
        title: 'Register Opened',
        description: 'New cash register session started',
      })
    } catch (error) {
      console.error('[v0] Error saving register:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save register',
        variant: 'destructive',
      })
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

  const openRegisters = openRegistersState
  const closedRegisters = closedRegistersState

  return (
    <>
      {/* Edit Staff Assignment Dialog */}
      <AlertDialog open={showEditStaffDialog} onOpenChange={setShowEditStaffDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Staff Assignment</AlertDialogTitle>
            <AlertDialogDescription>
              Assign a different staff member to manage this cash register
            </AlertDialogDescription>
          </AlertDialogHeader>

          {editingRegister && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Register: {editingRegister.register_name}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Assign to Staff Member</label>
                <Select value={newStaffId} onValueChange={setNewStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff member" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffMembers.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.first_name} {staff.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmEditStaff} disabled={processing || !newStaffId}>
              {processing ? 'Updating...' : 'Update Assignment'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Close Register - Summary
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please verify the cash count and confirm closing details
            </AlertDialogDescription>
          </AlertDialogHeader>

          {closingData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-3 bg-muted rounded">
                <div>
                  <p className="text-sm text-muted-foreground">Cash Sales</p>
                  <p className="text-lg font-semibold">{business?.currency_code} {closingData.cashSales.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Non-Cash Sales</p>
                  <p className="text-lg font-semibold">{business?.currency_code} {closingData.nonCashSales.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Small Expenses</p>
                  <p className="text-lg font-semibold">-{business?.currency_code} {closingData.smallExpenses.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Opening Balance</p>
                  <p className="text-lg font-semibold">{business?.currency_code} {closingData.register.opening_balance.toFixed(2)}</p>
                </div>
              </div>

              <div className="p-3 bg-blue-50 rounded border border-blue-200">
                <p className="text-sm text-blue-700 font-semibold">
                  Expected Cash: {business?.currency_code} {closingData.expectedCash.toFixed(2)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Actual Cash Count</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={closingAmount}
                  onChange={(e) => setClosingAmount(e.target.value)}
                />
              </div>

              {closingAmount && (
                <div className={`p-3 rounded ${
                  parseFloat(closingAmount) === closingData.expectedCash
                    ? 'bg-green-50 border border-green-200'
                    : parseFloat(closingAmount) > closingData.expectedCash
                      ? 'bg-yellow-50 border border-yellow-200'
                      : 'bg-red-50 border border-red-200'
                }`}>
                  <p className="text-sm font-semibold">
                    Variance: {parseFloat(closingAmount) > closingData.expectedCash ? '+' : ''}{(parseFloat(closingAmount) - closingData.expectedCash).toFixed(2)}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium mb-2 block">Notes</label>
                <Textarea
                  placeholder="Add any notes about this closing..."
                  value={closingNotes}
                  onChange={(e) => setClosingNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={processing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmClose}
              disabled={processing || !closingAmount}
              className="gap-2"
            >
              {processing && <Loader2 className="w-4 h-4 animate-spin" />}
              {processing ? 'Closing Register...' : 'Confirm & Close'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Cash Register</h1>
            <p className="text-muted-foreground mt-1">Manage cash register operations and cash up</p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Create Register
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
            businessId={business?.id}
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
                    <div className="space-y-2 mt-4">
                      <Button
                        className="w-full"
                        variant="default"
                        onClick={() => handleOpenCloseDialog(register)}
                        disabled={register.staff_id !== user?.id && userRole !== 'admin'}
                      >
                        Close Register
                      </Button>
                      {userRole === 'admin' && (
                        <Button
                          className="w-full bg-transparent"
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditStaffDialog(register)}
                          disabled={processing}
                        >
                          <Edit2 className="w-4 h-4 mr-2" />
                          Change Staff
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Recent Closed Registers */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Register History</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/cash-register/archive')}
              disabled={userRole !== 'admin' && userRole !== 'manager'}
              className="gap-2"
            >
              View Archive
            </Button>
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
                      applyDateFilter(closedRegistersState)
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
                      applyDateFilter(closedRegistersState)
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
                        applyDateFilter(closedRegistersState)
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
                        {(userRole === 'admin' || userRole === 'manager') && (
                          <th className="px-6 py-3 text-left font-semibold w-12">
                            <Checkbox
                              checked={selectedRegisters.size === displayedHistory.length && displayedHistory.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                          </th>
                        )}
                        <th className="px-6 py-3 text-left font-semibold">Register</th>
                        <th className="px-6 py-3 text-left font-semibold">Cashier</th>
                        <th className="px-6 py-3 text-left font-semibold">Date</th>
                        <th className="px-6 py-3 text-right font-semibold">Opening</th>
                        <th className="px-6 py-3 text-right font-semibold">Closing</th>
                        <th className="px-6 py-3 text-right font-semibold">Variance</th>
                        <th className="px-6 py-3 text-left font-semibold">Status</th>
                        <th className="px-6 py-3 text-left font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedHistory.map((register) => {
                        const variance = register.variance || 0
                        const varianceColor =
                          variance > 0
                            ? 'text-red-600'
                            : variance < 0
                              ? 'text-green-600'
                              : 'text-gray-600'

                        return (
                          <tr key={register.id} className="border-b hover:bg-muted/50">
                            {(userRole === 'admin' || userRole === 'manager') && (
                              <td className="px-6 py-3">
                                <Checkbox
                                  checked={selectedRegisters.has(register.id)}
                                  onCheckedChange={() => handleSelectRegister(register.id)}
                                />
                              </td>
                            )}
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
                            <td className="px-6 py-3">
                              {(userRole === 'admin' || userRole === 'manager') && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleArchiveRegister(register.id)}
                                  className="text-xs"
                                >
                                  Archive
                                </Button>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  
                  {/* Pagination Controls */}
                  <div className="px-6 py-4 border-t flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Showing {historyPage * HISTORY_PAGE_SIZE + 1}-{Math.min((historyPage + 1) * HISTORY_PAGE_SIZE, filteredClosedRegisters.length)} of {filteredClosedRegisters.length}
                      {selectedRegisters.size > 0 && ` | ${selectedRegisters.size} selected`}
                    </div>
                    <div className="flex gap-2">
                      {selectedRegisters.size > 0 && (userRole === 'admin' || userRole === 'manager') && (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleBulkArchive}
                          disabled={processing}
                        >
                          Archive Selected ({selectedRegisters.size})
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={historyPage === 0}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={(historyPage + 1) * HISTORY_PAGE_SIZE >= filteredClosedRegisters.length}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
