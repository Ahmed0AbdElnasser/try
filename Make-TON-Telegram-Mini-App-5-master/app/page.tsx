'use client'

import { useEffect, useState } from 'react'
import { WebApp } from '@twa-dev/types'

declare global {
  interface Window {
    Telegram?: {
      WebApp: WebApp
    }
  }
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState('')
  const [loading, setLoading] = useState(true)  // حالة التحميل
  const [skip, setSkip] = useState(false)  // حالة تخطي البيانات

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      console.log('Telegram WebApp is ready'); // تحقق من تحميل المكتبة

      const initDataUnsafe = tg.initDataUnsafe || {}

      if (initDataUnsafe.user) {
        fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(initDataUnsafe.user),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              setError(data.error)
            } else {
              setUser(data)
            }
          })
          .catch((err) => {
            setError('Failed to fetch user data')
          })
          .finally(() => setLoading(false))
      } else {
        setError('No user data available')
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    console.log('Current skip state:', skip); // تحقق من حالة التخطي
    if (skip) {
      setUser({
        firstName: 'Guest',
        points: 0,
        invitedCount: 0,
        referralLink: ''
      })
      setLoading(false)
    }
  }, [skip])

  const handleIncreasePoints = async () => {
    if (!user) return

    try {
      const res = await fetch('/api/increase-points', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId: user.telegramId }),
      })
      const data = await res.json()
      if (data.success) {
        setUser({ ...user, points: data.points })
        setNotification('Points increased successfully!')
        setTimeout(() => setNotification(''), 3000)
      } else {
        setError('Failed to increase points')
      }
    } catch (err) {
      setError('An error occurred while increasing points')
    }
  }

  const handleSkipData = () => {
    console.log('Skip button clicked'); // تحقق من الضغط على الزر
    setSkip(true)
  }

  const handleCopyReferralLink = () => {
    if (user && user.referralLink) {
      navigator.clipboard.writeText(user.referralLink)
      setNotification('Referral link copied to clipboard!')
      setTimeout(() => setNotification(''), 3000)
    }
  }

  if (loading) {
    return <div className="container mx-auto p-4">Loading...</div>
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 text-red-500">
        {error}
        <button
          onClick={handleSkipData}
          className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded mt-4"
        >
          Skip without Data
        </button>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.firstName}!</h1>
      <p>Your current points: {user.points}</p>
      <p>Your invited count: {user.invitedCount}</p>
      <button
        onClick={handleIncreasePoints}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
      >
        Increase Points
      </button>
      <button
        onClick={handleCopyReferralLink}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4 ml-4"
      >
        Copy Referral Link
      </button>
      {notification && (
        <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
          {notification}
        </div>
      )}
    </div>
  )
}
