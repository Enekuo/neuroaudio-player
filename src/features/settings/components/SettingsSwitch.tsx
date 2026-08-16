type SettingsSwitchProps = {
  checked: boolean
  onChange?: (checked: boolean) => void
  disabled?: boolean
  ariaLabel: string
}

function SettingsSwitch({ checked, onChange, disabled, ariaLabel }: SettingsSwitchProps) {
  return (
    <label className={`settings-switch${disabled ? ' is-disabled' : ''}`}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(event) => onChange?.(event.target.checked)}
      />
      <span className="settings-switch__track" aria-hidden="true">
        <span className="settings-switch__thumb" />
      </span>
    </label>
  )
}

export default SettingsSwitch
