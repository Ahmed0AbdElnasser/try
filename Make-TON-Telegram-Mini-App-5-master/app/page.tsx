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

  useEffect(() => {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp
      tg.ready()

      const initData = tg.initData || ''
      const initDataUnsafe = tg.initDataUnsafe || {}

      if (initDataUnsafe.user) {
        const userData = {
          ...initDataUnsafe.user,
          invitedCount: 0, // عدد الأشخاص الذين تم دعوتهم
          points: 0,       // نقاط المستخدم
          pointsRequired: 1000, // النقاط المطلوبة
        };

        fetch('/api/user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(userData),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.error) {
              setError(data.error)
            } else {
              setUser(data);
              alert('You have earned $5! To withdraw it, invite 10 people and press "Increase Points" 1000 times.');
            }
          })
          .catch((err) => {
            setError('Failed to fetch user data')
          })
      } else {
        setError('No user data available')
      }
    } else {
      setError('This app should be opened in Telegram')
    }
  }, [])

  const handleIncreasePoints = async () => {
    if (!user) return

    // تحقق مما إذا كان المستخدم قد حقق النقاط المطلوبة
    if (user.points < user.pointsRequired) {
      setError(`You need to click ${user.pointsRequired} times to increase your points.`);
      return;
    }

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
        // زيادة النقاط
        setUser({ ...user, points: data.points });
        setNotification('Points increased successfully!');

        // تحقق من عدد الأشخاص الذين تم دعوتهم
        if (user.invitedCount >= 10) {
          setNotification('Congratulations! You can withdraw your $5!');
        }
        
        setTimeout(() => setNotification(''), 3000);
      } else {
        setError('Failed to increase points')
      }
    } catch (err) {
      setError('An error occurred while increasing points')
    }
  }

  if (error) {
    return <div className="container mx-auto p-4 text-red-500">{error}</div>
  }

  if (!user) return <div className="container mx-auto p-4">Loading...</div>

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Welcome, {user.firstName}!</h1>
      <p>Your current points: {user.points}</p>
      <p>Your referral link: https://yourapp.com/invite?ref=${user.telegramId}</p>
      <button
        onClick={handleIncreasePoints}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
      >
        Increase Points
      </button>
      {notification && (
        <div className="mt-4 p-2 bg-green-100 text-green-700 rounded">
          {notification}
        </div>
      )}
    </div>
  )
}
