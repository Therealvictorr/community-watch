'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Share2, Copy, Check, MessageCircle, Twitter, Facebook } from 'lucide-react'

interface ShareButtonProps {
  title: string
  description?: string
  reportType: string
  className?: string
}

export function ShareButton({ title, description, reportType, className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const getShareUrl = () => {
    if (typeof window !== 'undefined') return window.location.href
    return ''
  }

  const getShareText = () => {
    const typeLabel = reportType === 'missing_child' ? '🚨 MISSING PERSON' 
      : reportType === 'missing_item' ? '⚠️ MISSING ITEM' 
      : '📢 COMMUNITY ALERT'
    
    let text = `${typeLabel}: ${title}`
    if (description) {
      text += `\n\n${description.slice(0, 200)}${description.length > 200 ? '...' : ''}`
    }
    text += '\n\nPlease share and help!'
    return text
  }

  const shareWhatsApp = () => {
    const text = encodeURIComponent(`${getShareText()}\n\n${getShareUrl()}`)
    window.open(`https://wa.me/?text=${text}`, '_blank')
  }

  const shareTwitter = () => {
    const text = encodeURIComponent(getShareText())
    const url = encodeURIComponent(getShareUrl())
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  const shareFacebook = () => {
    const url = encodeURIComponent(getShareUrl())
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for insecure contexts
      const textarea = document.createElement('textarea')
      textarea.value = getShareUrl()
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const nativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text: getShareText(),
          url: getShareUrl(),
        })
      } catch {
        // User cancelled or share failed
      }
    }
  }

  // Use native share on mobile if available
  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={className}>
          <Share2 className="h-4 w-4 mr-1.5" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={shareWhatsApp} className="cursor-pointer">
          <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareTwitter} className="cursor-pointer">
          <Twitter className="h-4 w-4 mr-2 text-sky-500" />
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={shareFacebook} className="cursor-pointer">
          <Facebook className="h-4 w-4 mr-2 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyLink} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="h-4 w-4 mr-2" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
        {hasNativeShare && (
          <DropdownMenuItem onClick={nativeShare} className="cursor-pointer">
            <Share2 className="h-4 w-4 mr-2" />
            More Options...
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
