import { useEffect, useState } from 'react'
import { subscribeToMembers, subscribeToSetupMeta } from '../services/members'
import { DEFAULT_ROLE_SLOTS } from '../utils/setupPhase'

const EMPTY_META = {
  roleSlots: { ...DEFAULT_ROLE_SLOTS },
  managerWinnerId: '',
  managerWinnerName: '',
  isManagerVoteFinalized: false,
}

export function useMembers() {
  const [members, setMembers] = useState([])
  const [setupMeta, setSetupMeta] = useState(EMPTY_META)
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [isLoadingMeta, setIsLoadingMeta] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribeMembers = subscribeToMembers(
      (nextMembers) => {
        setMembers(nextMembers)
        setError('')
        setIsLoadingMembers(false)
      },
      (nextError) => {
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to load members right now.',
        )
        setIsLoadingMembers(false)
      },
    )

    const unsubscribeMeta = subscribeToSetupMeta(
      (nextMeta) => {
        setSetupMeta(nextMeta)
        setError('')
        setIsLoadingMeta(false)
      },
      (nextError) => {
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to load setup data right now.',
        )
        setIsLoadingMeta(false)
      },
    )

    return () => {
      unsubscribeMembers()
      unsubscribeMeta()
    }
  }, [])

  return {
    members,
    setupMeta,
    isLoading: isLoadingMembers || isLoadingMeta,
    error,
  }
}
