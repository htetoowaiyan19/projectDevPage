import './MemberProjectForm.css'

export function MemberProjectForm({
  form,
  onChange,
  onSubmit,
  isSubmitting,
}) {
  return (
    <form className="member-form" onSubmit={onSubmit}>
      <div className="member-form__grid">
        <label className="member-form__field">
          <span>Name</span>
          <small>Your full name as registered</small>
          <input
            name="name"
            value={form.name}
            onChange={onChange}
            required
          />
        </label>

        <label className="member-form__field">
          <span>Phone Number</span>
          <small>Your contact number</small>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={onChange}
            required
          />
        </label>

        <label className="member-form__field">
          <span>Email</span>
          <small>Your personal email address</small>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
          />
        </label>

        <label className="member-form__field">
          <span>Telegram Username</span>
          <small>Your Telegram username (without @)</small>
          <input
            name="telegram"
            value={form.telegram}
            onChange={onChange}
            required
          />
        </label>

        <label className="member-form__field">
          <span>Discord Username</span>
          <small>Your Discord username (e.g., user#1234)</small>
          <input
            name="discord"
            value={form.discord}
            onChange={onChange}
            required
          />
        </label>

        <label className="member-form__field">
          <span>GitHub Username</span>
          <small>Your GitHub username</small>
          <input
            name="github"
            value={form.github}
            onChange={onChange}
            required
          />
        </label>

        <label className="member-form__field">
          <span>Project Title</span>
          <small>Your project title.</small>
          <input
            name="title"
            value={form.title}
            onChange={onChange}
            required
          />
        </label>

        <label className="member-form__field">
          <span>Project Type</span>
          <small>Category of your project</small>
          <small>Software - Only software-related project, programming-related, no mechanical, or hardware components</small>
          <small>Hardware - Hardware-related project, minimal programming</small>
          <small>Hybrid - Combination of both hardware and software</small>
          <select
            name="projectType"
            value={form.projectType}
            onChange={onChange}
          >
            <option value="Software">Software</option>
            <option value="Hardware">Hardware</option>
            <option value="Hybrid">Hybrid</option>
          </select>
        </label>

        <label className="member-form__field">
          <span>Requirements</span>
          <small>Detailed description about what programming languages/scripts used, what type of hardware used, and list all hardware components</small>
          <textarea
            name="requirements"
            value={form.requirements}
            onChange={onChange}
            rows="3"
            required
          />
        </label>

        <label className="member-form__field">
          <span>Description</span>
          <small>Explain about your project on how useful it is in current age, what are the main purpose, aim, and objectives of this project, and how your project will function</small>
          <textarea
            name="description"
            value={form.description}
            onChange={onChange}
            rows="4"
            required
          />
        </label>

        <label className="member-form__field">
          <span>Solution</span>
          <small>Briefly explain your solution to this project proposal. This is necessary to check whether this proposal/project</small>
          <textarea
            name="solution"
            value={form.solution}
            onChange={onChange}
            rows="4"
            required
          />
        </label>
      </div>

      <div className="member-form__terms">
        <label className="member-form__checkbox">
          <input
            type="checkbox"
            name="agreedToTerms"
            checked={form.agreedToTerms || false}
            onChange={onChange}
            required
          />
          <span>
            I agree to the{' '}
            <a
              href="https://drive.google.com/file/d/1Ylvpm3-Jexrcm9KhPwDPIf7LtoB90a_6/view?usp=sharing"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Terms and Conditions
            </a>
          </span>
        </label>
      </div>

      <div className="member-form__actions">
        <button
          type="submit"
          className="vote-card__button"
          disabled={isSubmitting}
        >
          Submit project
        </button>
      </div>
    </form>
  )
}