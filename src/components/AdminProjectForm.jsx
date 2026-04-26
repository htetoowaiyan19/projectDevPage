export function AdminProjectForm({
  form,
  onChange,
  onSubmit,
  onCancel,
  isEditing,
  isSubmitting,
  showPointMultiplier = true,
  submitLabel,
}) {
  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <div className="admin-form__grid">
        <label className="admin-form__field">
          <span>Project Title</span>
          <input name="title" value={form.title} onChange={onChange} required />
        </label>

        <label className="admin-form__field">
          <span>Project Type</span>
          <select name="projectType" value={form.projectType} onChange={onChange}>
            <option value="Software">Software</option>
            <option value="Hardware">Hardware</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </label>

        <label className="admin-form__field">
          <span>Requirements</span>
          <textarea
            name="requirements"
            value={form.requirements}
            onChange={onChange}
            rows="3"
            required
          />
        </label>

        <label className="admin-form__field">
          <span>Description</span>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows="4"
            required
          />
        </label>

        <label className="admin-form__field">
          <span>Solution</span>
          <textarea
            name="solution"
            value={form.solution}
            onChange={onChange}
            rows="4"
            required
          />
        </label>

        {showPointMultiplier ? (
          <label className="admin-form__field">
            <span>Point Multiplier</span>
            <input
              name="pointMultiplier"
              type="number"
              min="0"
              step="0.01"
              value={form.pointMultiplier}
              onChange={onChange}
              required
            />
          </label>
        ) : null}
      </div>

      <div className="admin-form__actions">
        <button type="submit" className="vote-card__button" disabled={isSubmitting}>
          {submitLabel ?? (isEditing ? 'Save project' : 'Add project')}
        </button>
        {isEditing ? (
          <button
            type="button"
            className="admin-form__ghost"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel edit
          </button>
        ) : null}
      </div>
    </form>
  )
}
