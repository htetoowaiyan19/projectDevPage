import { ROLL_NUMBER_PREFIX } from '../services/studentAuth'

export function RollNumberField({ value, onChange }) {
  return (
    <label className="roll-field">
      <span className="roll-field__label">Roll number</span>
      <div className="roll-field__input-wrap">
        <span className="roll-field__prefix">{ROLL_NUMBER_PREFIX}</span>
        <input
          className="roll-field__input"
          type="text"
          inputMode="numeric"
          autoComplete="off"
          placeholder="1"
          value={value}
          onChange={onChange}
          aria-label="Roll number"
        />
      </div>
    </label>
  )
}
