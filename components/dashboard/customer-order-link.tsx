'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CustomerOrderLinkProps {
  business: any
}

export default function CustomerOrderLink({ business }: CustomerOrderLinkProps) {
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const customerOrderUrl = `${baseUrl}/?business_id=${business.id}`

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(customerOrderUrl)
      setCopied(true)
      toast({
        title: 'Copied!',
        description: 'Customer order link copied to clipboard',
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('[v0] Error copying link:', error)
      toast({
        title: 'Error',
        description: 'Failed to copy link',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Order Link</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            id="customer-order-url"
            name="customerOrderUrl"
            value={customerOrderUrl}
            readOnly
            className="bg-muted"
            onClick={(e) => e.currentTarget.select()}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={handleCopyLink}
            className={copied ? 'bg-green-50' : ''}
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
