import { createPortal } from 'react-dom'

export function CenterDialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
  showCancel = false,
}) {
  if (!open) {
    return null
  }

  return createPortal(
    <div className="center-dialog__backdrop" role="presentation" onClick={onClose}>
      <div
        className="center-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="center-dialog__title">{title}</h3>
        <p className="center-dialog__message">{message}</p>
        <div className="center-dialog__actions">
          {showCancel ? (
            <button
              type="button"
              className="center-dialog__button center-dialog__button--ghost"
              onClick={onClose}
            >
              {cancelLabel}
            </button>
          ) : null}
          <button type="button" className="center-dialog__button" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
