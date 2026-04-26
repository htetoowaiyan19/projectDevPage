import { useState } from 'react'
import { MemberProjectForm } from '../components/MemberProjectForm'
import { getEmptyProjectForm } from '../components/projectFormState'
import { PhasePanel } from '../components/PhasePanel'
import { submitMemberProject } from '../services/projects'

export function PreparationPhase({ currentUser, onUserUpdate }) {
  const [form, setForm] = useState(getEmptyProjectForm())
  const [feedback, setFeedback] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function handleChange(event) {
    const { name, value } = event.target
    setForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    if (!currentUser || currentUser.hasProject || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    setFeedback('')

    try {
      await submitMemberProject({
        memberId: currentUser.id,
        project: form,
      })

      onUserUpdate((previousUser) => ({
        ...previousUser,
        hasProject: true,
      }))
      setForm(getEmptyProjectForm())
      setFeedback('Project submitted for voting. You cannot submit another project in this phase.')
    } catch (nextError) {
      setFeedback(
        nextError instanceof Error
          ? nextError.message
          : 'Unable to submit your project right now.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PhasePanel
      phaseId="preparation"
      title="Preparation Phase"
      intro="Each member can submit one project proposal here before voting opens."
      meta={currentUser?.hasProject ? 'Submission status: locked' : 'Submission status: open'}
    >
      <div className="phase-toolbar">
        <div className="phase-toolbar__pill">
          One proposal per member
        </div>
      </div>

      {feedback ? <p className="phase-feedback">{feedback}</p> : null}

      {currentUser?.hasProject ? (
        <div className="placeholder-block">
          <p>Your project has already been submitted for the Preparation phase.</p>
        </div>
      ) : (
        <div className="preparation-layout preparation-layout--single">
          <MemberProjectForm
            form={form}
            onChange={handleChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        </div>
      )}
    </PhasePanel>
  )
}
