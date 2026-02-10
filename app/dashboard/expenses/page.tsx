'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Trash2 } from 'lucide-react'
import ExpenseForm from '@/components/expenses/expense-form'
import { useRouter } from 'next/navigation'

export default function ExpensesPage() {
  const [business, setBusiness] = useState<any>(null)
  const [expenses, setExpenses] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
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
        const { data: expensesData } = await supabase
          .from('expenses')
          .select('*')
          .eq('business_id', businessData.id)
          .order('expense_date', { ascending: false })

        setExpenses(expensesData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const filteredExpenses = expenses.filter(
    (expense) =>
      expense.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  const handleSaveExpense = async (formData: any) => {
    const supabase = createClient()

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) throw new Error('Not authenticated')

      // Get staff record for the current user
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', user.id)
        .eq('business_id', business.id)
        .single()

      if (staffError || !staffData) {
        throw new Error('Staff record not found. Please ensure your user profile is set up correctly.')
      }

      const { error } = await supabase
        .from('expenses')
        .insert([{ ...formData, business_id: business.id, created_by: staffData.id }])

      if (error) throw error

      const { data: expensesData } = await supabase
        .from('expenses')
        .select('*')
        .eq('business_id', business.id)
        .order('expense_date', { ascending: false })

      setExpenses(expensesData || [])
      setShowForm(false)
    } catch (error) {
      console.error('[v0] Error saving expense:', error)
      alert('Error saving expense')
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId)

      if (error) throw error

      setExpenses(expenses.filter((e) => e.id !== expenseId))
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('Error deleting expense')
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
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground mt-1">Track business expenses</p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Expense
        </Button>
      </div>

      {showForm && (
        <ExpenseForm
          onSave={handleSaveExpense}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <p className="text-2xl font-bold">
              {business.currency_code} {totalExpenses.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search expenses..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Expenses Table */}
      <Card>
        <CardContent className="p-0">
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No expenses found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Date</th>
                    <th className="px-6 py-3 text-left font-semibold">Category</th>
                    <th className="px-6 py-3 text-left font-semibold">Description</th>
                    <th className="px-6 py-3 text-right font-semibold">Amount</th>
                    <th className="px-6 py-3 text-center font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.map((expense) => (
                    <tr key={expense.id} className="border-b hover:bg-muted/50">
                      <td className="px-6 py-3">
                        {new Date(expense.expense_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 capitalize font-medium">
                        {expense.category}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {expense.description}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold">
                        {business.currency_code} {expense.amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteExpense(expense.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
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
