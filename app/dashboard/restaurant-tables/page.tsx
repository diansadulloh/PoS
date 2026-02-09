'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Users } from 'lucide-react'
import TableForm from '@/components/restaurant-tables/table-form'
import { useRouter } from 'next/navigation'

export default function RestaurantTablesPage() {
  const [business, setBusiness] = useState<any>(null)
  const [tables, setTables] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedTable, setSelectedTable] = useState<any>(null)
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
        .maybeSingle()

      setBusiness(businessData)

      if (businessData) {
        const { data: tablesData } = await supabase
          .from('restaurant_tables')
          .select('*')
          .eq('business_id', businessData.id)
          .order('table_number')

        setTables(tablesData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [router])

  const handleSaveTable = async (formData: any) => {
    const supabase = createClient()

    try {
      console.log('[v0] Saving table with data:', formData)

      if (selectedTable) {
        const { data, error } = await supabase
          .from('restaurant_tables')
          .update(formData)
          .eq('id', selectedTable.id)
          .select()

        console.log('[v0] Table update response:', { data, error })

        if (error) {
          console.error('[v0] Table update error - code:', error.code)
          console.error('[v0] Table update error - message:', error.message)
          console.error('[v0] Table update error - details:', error.details)
          console.error('[v0] Table update error - hint:', error.hint)
          throw new Error(error.message || 'Failed to update table')
        }
      } else {
        const { data, error } = await supabase
          .from('restaurant_tables')
          .insert([{ ...formData, business_id: business.id }])
          .select()

        console.log('[v0] Table insert response:', { data, error })

        if (error) {
          console.error('[v0] Table insert error - code:', error.code)
          console.error('[v0] Table insert error - message:', error.message)
          console.error('[v0] Table insert error - details:', error.details)
          console.error('[v0] Table insert error - hint:', error.hint)
          throw new Error(error.message || 'Failed to create table')
        }
      }

      const { data: tablesData } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('business_id', business.id)
        .order('table_number')

      setTables(tablesData || [])
      setShowForm(false)
      setSelectedTable(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Error saving table:', errorMessage)
      alert(`Error saving table: ${errorMessage}`)
    }
  }

  const handleDeleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return

    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', tableId)

      if (error) throw error

      setTables(tables.filter((t) => t.id !== tableId))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('[v0] Error deleting table:', errorMessage)
      alert(`Error deleting table: ${errorMessage}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-700'
      case 'occupied':
        return 'bg-red-100 text-red-700'
      case 'reserved':
        return 'bg-blue-100 text-blue-700'
      case 'cleaning':
        return 'bg-yellow-100 text-yellow-700'
      case 'maintenance':
        return 'bg-gray-100 text-gray-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const groupTablesBySection = () => {
    const grouped: Record<string, any[]> = {}
    tables.forEach((table) => {
      const section = table.section || 'main'
      if (!grouped[section]) {
        grouped[section] = []
      }
      grouped[section].push(table)
    })
    return grouped
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
            {'You need to create a business profile before managing tables.'}
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

  const groupedTables = groupTablesBySection()
  const sectionNames: Record<string, string> = {
    main: 'Main Dining',
    patio: 'Patio',
    bar: 'Bar Area',
    private: 'Private Room',
    terrace: 'Terrace',
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Restaurant Tables</h1>
          <p className="text-muted-foreground mt-1">
            Manage restaurant table assignments and status
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Table
        </Button>
      </div>

      {showForm && (
        <TableForm
          table={selectedTable}
          onSave={handleSaveTable}
          onCancel={() => {
            setShowForm(false)
            setSelectedTable(null)
          }}
        />
      )}

      {tables.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No tables added yet</p>
            <p className="text-sm mt-1">
              {'Click "Add Table" to create your first table'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTables).map(([section, sectionTables]) => (
            <Card key={section}>
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  {sectionNames[section] || section}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                  {sectionTables.map((table) => (
                    <Card
                      key={table.id}
                      className="p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="font-semibold text-lg">
                              {table.table_number}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Users className="w-3 h-3" />
                              <span>{table.seat_capacity} seats</span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(table.status)}`}
                        >
                          {table.status}
                        </span>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs bg-transparent"
                            onClick={() => {
                              setSelectedTable(table)
                              setShowForm(true)
                            }}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 text-xs bg-transparent"
                            onClick={() => handleDeleteTable(table.id)}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
