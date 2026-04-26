import { useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { PhaseHero } from './components/PhaseHero'
import { PhaseTimeline } from './components/PhaseTimeline'
import { phases } from './data/phases'
import { useFirebaseClock } from './hooks/useFirebaseClock'
import { LoginPage } from './pages/LoginPage'
import { AdminPanelPage } from './pages/AdminPanelPage'
import { BuildingPhase } from './pages/BuildingPhase'
import { MaintenancePhase } from './pages/MaintenancePhase'
import { PreparationPhase } from './pages/PreparationPhase'
import { ProjectDetailPage } from './pages/ProjectDetailPage'
import { VotingPhase } from './pages/VotingPhase'
import { formatPhaseCountdown, getCurrentPhaseByTime, getDefaultPhasePath, getPhaseEndMs } from './utils/phaseSchedule'

const SESSION_STORAGE_KEY = 'project-framework-session'

function AppShell({ currentUser, currentPhase, phaseCountdownLabel, onUserUpdate, onLogout }) {
  const location = useLocation()
  const activePhase =
    phases.find((phase) => location.pathname.startsWith(phase.path)) ?? phases[0]
  const defaultPhasePath = currentPhase.path
  const isAdmin = Boolean(currentUser?.canManageProjects)
  const canAccessPhase = (phase) => isAdmin || phase.id === currentPhase.id
  const isOnProjectDetail = location.pathname.startsWith('/projects/')

  if (!isAdmin) {
    if (isOnProjectDetail && currentPhase.id !== 'voting') {
      return <Navigate to={defaultPhasePath} replace />
    }

    if (!isOnProjectDetail && activePhase.id !== currentPhase.id) {
      return <Navigate to={defaultPhasePath} replace />
    }
  }

  return (
    <div className="app-shell">
      <div className="app-noise" aria-hidden="true" />
      <div className="app-grid" aria-hidden="true" />
      <header className="app-header">
        <PhaseHero
          activePhase={currentPhase}
          currentUser={currentUser}
          phaseCountdownLabel={phaseCountdownLabel}
          onLogout={onLogout}
        />
        <PhaseTimeline
          phases={phases}
          currentPhaseId={currentPhase.id}
          canAccessPhase={canAccessPhase}
        />
      </header>

      <main className="app-main">
        <Routes>
          <Route
            path="/preparation"
            element={
              <PreparationPhase currentUser={currentUser} onUserUpdate={onUserUpdate} />
            }
          />
          <Route
            path="/voting"
            element={
              <VotingPhase currentUser={currentUser} onUserUpdate={onUserUpdate} />
            }
          />
          <Route
            path="/projects/:projectId"
            element={
              <ProjectDetailPage
                currentUser={currentUser}
                onUserUpdate={onUserUpdate}
              />
            }
          />
          <Route
            path="/setup"
            element={
              <MaintenancePhase
                phaseId="setup"
                title="Setup Phase"
                intro="This space is reserved for setup steps, team alignment, and environment preparation after voting concludes."
                meta="Setup lane: under maintenance"
              />
            }
          />
          <Route
            path="/building"
            element={<BuildingPhase />}
          />
          <Route
            path="/checkup"
            element={
              <MaintenancePhase
                phaseId="checkup"
                title="Checkup Phase"
                intro="This space is reserved for later validation, review, and closing checks once the build period is complete."
                meta="Checkup lane: under maintenance"
              />
            }
          />
          <Route
            path="/admin"
            element={
              currentUser?.canManageProjects ? (
                <AdminPanelPage />
              ) : (
                <Navigate to={defaultPhasePath} replace />
              )
            }
          />
          <Route path="*" element={<Navigate to={defaultPhasePath} replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const storedSession = window.sessionStorage.getItem(SESSION_STORAGE_KEY)

    if (!storedSession) {
      return null
    }

    try {
      return JSON.parse(storedSession)
    } catch {
      window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }
  })
  const { now, isLoading: isClockLoading, error: clockError } = useFirebaseClock()

  const currentPhase = now ? getCurrentPhaseByTime(now.getTime()) : null
  const defaultPhasePath = now ? getDefaultPhasePath(now.getTime()) : '/preparation'
  const phaseEndMs = currentPhase ? getPhaseEndMs(currentPhase.id) : null
  const phaseCountdownLabel =
    now && phaseEndMs ? formatPhaseCountdown(phaseEndMs - now.getTime()) : 'Syncing...'

  function handleLogin(user) {
    setCurrentUser(user)
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user))
  }

  function handleUserUpdate(updater) {
    setCurrentUser((previousUser) => {
      const nextUser =
        typeof updater === 'function' ? updater(previousUser) : updater

      window.sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextUser))
      return nextUser
    })
  }

  function handleLogout() {
    setCurrentUser(null)
    window.sessionStorage.removeItem(SESSION_STORAGE_KEY)
  }

  if (isClockLoading || !currentPhase) {
    return (
      <div className="app-shell">
        <main className="app-main">
          <section className="phase-panel">
            <div className="placeholder-block">
              <p>{clockError || 'Syncing the Firebase server clock for Myanmar time...'}</p>
            </div>
          </section>
        </main>
      </div>
    )
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={
          currentUser ? (
            <Navigate to={defaultPhasePath} replace />
          ) : (
            <LoginPage onLogin={handleLogin} />
          )
        }
      />
      <Route
        path="/"
        element={<Navigate to={currentUser ? defaultPhasePath : '/login'} replace />}
      />
      <Route
        path="/*"
        element={
          currentUser ? (
            <AppShell
              currentUser={currentUser}
              currentPhase={currentPhase}
              phaseCountdownLabel={phaseCountdownLabel}
              onUserUpdate={handleUserUpdate}
              onLogout={handleLogout}
            />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  )
}
