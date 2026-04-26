import { useEffect, useState } from 'react'
import { subscribeToProjects } from '../services/projects'

export function useProjects() {
  const [projects, setProjects] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToProjects(
      (nextProjects) => {
        setProjects(nextProjects)
        setError('')
        setIsLoading(false)
      },
      (nextError) => {
        setError(
          nextError instanceof Error
            ? nextError.message
            : 'Unable to load projects right now.',
        )
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [])

  return { projects, isLoading, error }
}
