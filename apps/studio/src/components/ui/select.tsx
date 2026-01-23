import * as React from "react"

interface SelectContextValue {
  value: string
  onChange: (value: string) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

export interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}

export function Select({ value, onValueChange, children }: SelectProps) {
  return (
    <SelectContext.Provider value={{ value, onChange: onValueChange }}>
      {children}
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  const context = React.useContext(SelectContext)
  const [isOpen, setIsOpen] = React.useState(false)

  if (!context) {
    throw new Error("SelectTrigger must be used within Select")
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        {children}
        <svg
          className="h-4 w-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
    </div>
  )
}

export function SelectValue() {
  const context = React.useContext(SelectContext)
  if (!context) {
    throw new Error("SelectValue must be used within Select")
  }

  // This is simplified - in a real implementation, you'd store the label
  return <span>{context.value}</span>
}

export function SelectContent({
  children,
  className = "",
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 ${className}`}
    >
      <div className="p-1">{children}</div>
    </div>
  )
}

export function SelectItem({
  value,
  children,
  className = "",
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const context = React.useContext(SelectContext)

  if (!context) {
    throw new Error("SelectItem must be used within Select")
  }

  return (
    <div
      onClick={() => context.onChange(value)}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
    >
      {children}
    </div>
  )
}
