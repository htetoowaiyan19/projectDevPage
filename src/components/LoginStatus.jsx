const STATUS_COPY = {
  idle: {
    iconClass: 'status-indicator__icon--idle',
    text: 'Enter your roll number to check your record.',
  },
  loading: {
    iconClass: 'status-indicator__icon--loading',
    text: 'Fetching data...',
  },
  success: {
    iconClass: 'status-indicator__icon--success',
    text: 'Success.',
  },
  error: {
    iconClass: 'status-indicator__icon--error',
    text: 'No user found.',
  },
}

export function LoginStatus({ status }) {
  const config = STATUS_COPY[status] ?? STATUS_COPY.idle

  return (
    <div className={`status-indicator status-indicator--${status}`} aria-live="polite">
      <span className={`status-indicator__icon ${config.iconClass}`} aria-hidden="true" />
      <span>{config.text}</span>
    </div>
  )
}
