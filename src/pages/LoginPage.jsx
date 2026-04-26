import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoginStatus } from '../components/LoginStatus'
import { RollNumberField } from '../components/RollNumberField'
import { fetchStudentByRollNumber } from '../services/studentAuth'

export function LoginPage({ onLogin }) {
  const navigate = useNavigate()
  const [rollValue, setRollValue] = useState('')
  const [passwordValue, setPasswordValue] = useState('')
  const [status, setStatus] = useState('idle')
  const [student, setStudent] = useState(null)
  const [lookupError, setLookupError] = useState('')
  const requestRef = useRef(0)

  useEffect(() => {
    const trimmedValue = rollValue.trim()

    if (!trimmedValue) {
      return undefined
    }

    const requestId = requestRef.current + 1
    requestRef.current = requestId

    const timeoutId = window.setTimeout(async () => {
      setStatus('loading')
      setLookupError('')

      try {
        const result = await fetchStudentByRollNumber(trimmedValue)

        if (requestRef.current !== requestId) {
          return
        }

        if (result) {
          setStudent(result)
          setStatus('success')
          return
        }

        setStudent(null)
        setStatus('error')
      } catch (error) {
        if (requestRef.current !== requestId) {
          return
        }

        setStudent(null)
        setStatus('error')
        setLookupError(
          error instanceof Error ? error.message : 'Unable to reach the database.',
        )
      }
    }, 350)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [rollValue])

  const accessMode =
    status === 'success' && student && passwordValue.trim() !== ''
      ? student.isAdmin && passwordValue.trim() === student.adminPassword
        ? 'admin'
        : passwordValue.trim() === student.password
          ? 'member'
          : null
      : null
  const canEnter = Boolean(accessMode)
  const showPasswordError =
    status === 'success' &&
    passwordValue.trim() !== '' &&
    student &&
    !accessMode
  const passwordHint = useMemo(
    () =>
      'Your password is the last 6 digits of your phone number submitted in the last event form. If you haven\'t submitted a form yet, you can use 000000 as the password. Note that this will change to your phone number once you submit the form.',
    [],
  )

  function handleRollChange(event) {
    const numericValue = event.target.value.replace(/\D/g, '').slice(0, 3)
    setRollValue(numericValue)
    setPasswordValue('')

    if (!numericValue) {
      setStatus('idle')
      setStudent(null)
      setLookupError('')
    }
  }

  function handlePasswordChange(event) {
    setPasswordValue(event.target.value)
  }

  function handleLogin() {
    if (!student) {
      return
    }

    if (!accessMode) {
      return
    }

    onLogin({
      ...student,
      accessMode,
      canManageProjects: accessMode === 'admin' && student.isAdmin,
    })
    navigate('/')
  }

  return (
    <div className="login-shell">
      <div className="login-shell__noise" aria-hidden="true" />
      <section className="login-panel">
        <div className="login-panel__hero">
          <p className="eyebrow">Group Project</p>
          <h1>Technological University Hmawbi</h1>
          <p className="login-panel__lede">
            Use your class roll number to enter the dashboard. This website will be used to update information about our project development process.
          </p>
        </div>

        <div className="login-grid">
          <div className="login-card">
            <div className="login-card__header">
              <div>
                <p className="eyebrow">Quick Access</p>
                <h2>Student login</h2>
              </div>
              <span className="login-card__badge">Live lookup</span>
            </div>

            <RollNumberField value={rollValue} onChange={handleRollChange} />
            <label className="roll-field">
              <span className="roll-field__label">Password</span>
              <div className="roll-field__input-wrap roll-field__input-wrap--plain">
                <input
                  className="roll-field__input roll-field__input--plain"
                  type="password"
                  inputMode="numeric"
                  autoComplete="current-password"
                  placeholder="Last 6 digits"
                  value={passwordValue}
                  onChange={handlePasswordChange}
                  aria-label="Password"
                />
              </div>
            </label>
            <LoginStatus status={status} />

            {lookupError ? (
              <p className="login-card__error">{lookupError}</p>
            ) : null}

            {showPasswordError ? (
              <p className="login-card__error">Incorrect password.</p>
            ) : null}

            {accessMode === 'admin' ? (
              <p className="login-card__success">Admin access confirmed.</p>
            ) : null}

            <p className="login-card__hint">{passwordHint}</p>

            <button
              type="button"
              className="login-card__button"
              onClick={handleLogin}
              disabled={!canEnter}
            >
              Enter dashboard
            </button>
          </div>

          <aside className="identity-card">
            <p className="eyebrow">Detected Profile</p>
            {student ? (
              <>
                <strong className="identity-card__name">{student.name || 'Unnamed student'}</strong>
                <p className="identity-card__roll">{student.rollNumber}</p>
                <p className="identity-card__copy">
                  Record found. Enter the matching password to continue to the dashboard.
                </p>
                {student.isAdmin ? (
                  <span className="identity-card__badge">Admin-capable account</span>
                ) : null}
              </>
            ) : (
              <>
                <strong className="identity-card__name">Waiting for match</strong>
                <p className="identity-card__copy">
                  When your roll number is found, your name will appear here outside
                  of the status feed.
                </p>
              </>
            )}
          </aside>
        </div>
      </section>
    </div>
  )
}
