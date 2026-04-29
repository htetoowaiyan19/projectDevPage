import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AdminProjectForm } from '../components/AdminProjectForm'
import { getEmptyProjectForm } from '../components/projectFormState'
import { useProjects } from '../hooks/useProjects'
import { createProject, removeProject, updateProject } from '../services/projects'

export function AdminPanelPage() {
  const { projects, isLoading, error } = useProjects()
  const [form, setForm] = useState(getEmptyProjectForm())
  const [editingProjectId, setEditingProjectId] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fields that should not be updated when editing existing projects
  const PROTECTED_FIELDS = ['name', 'phone', 'email', 'telegram', 'discord', 'github', 'agreedToTerms']

  const leaderboard = useMemo(
    () =>
      [...projects].sort(
        (left, right) => right.voteScore - left.voteScore || right.voteCount - left.voteCount,
      ),
    [projects],
  )

  const totalVotes = useMemo(
    () => projects.reduce((sum, project) => sum + project.voteCount, 0),
    [projects],
  )

  function handleFormChange(event) {
    const { name, value } = event.target
    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }))
  }

  function resetEditor() {
    setForm(getEmptyProjectForm())
    setEditingProjectId('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setFeedback('')

    try {
      if (editingProjectId) {
        // Preserve protected fields when editing
        const existingProject = projects.find((p) => p.id === editingProjectId)
        const protectedData = {}
        PROTECTED_FIELDS.forEach((field) => {
          if (existingProject && existingProject[field] !== undefined) {
            protectedData[field] = existingProject[field]
          }
        })
        await updateProject(editingProjectId, { ...form, ...protectedData })
        setFeedback('Project updated.')
      } else {
        await createProject(form)
        setFeedback('Project added.')
      }

      resetEditor()
    } catch (nextError) {
      setFeedback(
        nextError instanceof Error ? nextError.message : 'Unable to save project.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleEdit(project) {
    setEditingProjectId(project.id)
    setForm({
      title: project.title,
      projectType: project.projectType,
      requirements: project.requirements,
      description: project.description,
      solution: project.solution,
      pointMultiplier: String(project.pointMultiplier),
    })
  }

  async function handleDelete(projectId) {
    setFeedback('')

    try {
      await removeProject(projectId)
      if (editingProjectId === projectId) {
        resetEditor()
      }
      setFeedback('Project removed.')
    } catch (nextError) {
      setFeedback(
        nextError instanceof Error ? nextError.message : 'Unable to remove project.',
      )
    }
  }

  const leader = leaderboard[0] ?? null

  return (
    <section className="admin-panel">
      <div className="project-detail__head">
        <div>
          <p className="eyebrow">Admin Panel</p>
          <h2>Manage voting projects</h2>
        </div>
        <Link to="/voting" className="phase-toolbar__admin-link">
          Return to dashboard
        </Link>
      </div>

      <div className="admin-summary">
        <div className="admin-summary__card">
          <span>Projects</span>
          <strong>{projects.length}</strong>
        </div>
        <div className="admin-summary__card">
          <span>Total votes</span>
          <strong>{totalVotes}</strong>
        </div>
        <div className="admin-summary__card">
          <span>Current leader</span>
          <strong>{leader ? leader.title : 'No leader yet'}</strong>
        </div>
      </div>

      {feedback ? <p className="phase-feedback">{feedback}</p> : null}
      {error ? <p className="phase-feedback phase-feedback--error">{error}</p> : null}

      <div className="admin-layout">
        <div className="admin-layout__form">
          <AdminProjectForm
            form={form}
            onChange={handleFormChange}
            onSubmit={handleSubmit}
            onCancel={resetEditor}
            isEditing={Boolean(editingProjectId)}
            isSubmitting={isSubmitting}
          />
        </div>

        <div className="admin-layout__list">
          {isLoading ? (
            <div className="placeholder-block">
              <p>Loading current voting status...</p>
            </div>
          ) : (
            <div className="admin-projects">
              {leaderboard.map((project) => (
                <article key={project.id} className="admin-projects__item">
                  <div>
                    <strong>{project.title}</strong>
                    <p>
                      {project.projectType} | Score {project.voteScore.toFixed(2)} | Votes {project.voteCount}
                    </p>
                  </div>
                  <div className="admin-projects__actions">
                    <button
                      type="button"
                      className="admin-form__ghost"
                      onClick={() => handleEdit(project)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="admin-form__ghost admin-form__ghost--danger"
                      onClick={() => handleDelete(project.id)}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
