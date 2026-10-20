import styles from './FilterChips.module.scss'

export type ChipOption<T extends string> = {
  value: T | undefined
  label: string
  count?: number
  /** Sets data-category / data-kind so the chip takes that accent colour. */
  accent?: { category: string } | { kind: string }
}

type Props<T extends string> = {
  label: string
  options: ChipOption<T>[]
  selected: T | undefined
  onSelect: (value: T | undefined) => void
}

/** A single-select row of toggle chips. "All" is just an option whose value is undefined. */
export function FilterChips<T extends string>({ label, options, selected, onSelect }: Props<T>) {
  return (
    <div className={styles.chips} role="group" aria-label={label}>
      {options.map((option) => {
        const accentProps =
          option.accent && 'category' in option.accent
            ? { 'data-category': option.accent.category }
            : option.accent
              ? { 'data-kind': option.accent.kind }
              : {}
        return (
          <button
            key={option.value ?? '__all'}
            type="button"
            className={styles.chip}
            aria-pressed={option.value === selected}
            onClick={() => onSelect(option.value)}
            {...accentProps}
          >
            {option.label}
            {option.count !== undefined ? <span className={styles.count}>{option.count}</span> : null}
          </button>
        )
      })}
    </div>
  )
}
