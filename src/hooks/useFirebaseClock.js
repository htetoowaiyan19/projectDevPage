import { useEffect, useMemo, useState } from 'react'
import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const CLOCK_DOC_ID = 'server-clock'
const CLOCK_COLLECTION = '_system'

export function useFirebaseClock() {
  const [clockSample, setClockSample] = useState(null)
  const [tick, setTick] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const clockRef = doc(db, CLOCK_COLLECTION, CLOCK_DOC_ID)

    const unsubscribe = onSnapshot(
      clockRef,
      (snapshot) => {
        const serverNow = snapshot.data()?.serverNow

        if (!serverNow) {
          return
        }

        setClockSample({
          serverNowMs: serverNow.toMillis(),
          receivedAtMs: Date.now(),
        })
        setError('')
      },
      (nextError) => {
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to sync the Firebase server clock.',
        )
      },
    )

    async function syncClock() {
      try {
        await setDoc(
          clockRef,
          {
            serverNow: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true },
        )
      } catch (nextError) {
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to sync the Firebase server clock.',
        )
      }
    }

    syncClock()
    const syncInterval = window.setInterval(syncClock, 60_000)

    return () => {
      window.clearInterval(syncInterval)
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    const tickInterval = window.setInterval(() => {
      setTick(Date.now())
    }, 1_000)

    return () => {
      window.clearInterval(tickInterval)
    }
  }, [])

  const now = useMemo(() => {
    if (!clockSample) {
      return null
    }

    return new Date(clockSample.serverNowMs + (tick - clockSample.receivedAtMs))
  }, [clockSample, tick])

  return {
    now,
    isLoading: !clockSample && !error,
    error,
  }
}
