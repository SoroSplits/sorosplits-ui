import clsx from "clsx"
import { ChangeEvent } from "react"

interface InputProps {
  onChange: (value: string) => void
  placeholder: string
  small?: boolean
  value: string
  subtext?: string
  maxLength?: number
  numeric?: boolean
}

const Input = ({
  onChange,
  value,
  placeholder,
  small,
  subtext,
  maxLength,
  numeric,
}: InputProps) => {
  const change = (e: ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value
    // if (numeric && !/^\d*\.?\d*$/.test(inputValue)) {
    //   return;
    // }
    if (!numeric && /[^a-zA-Z0-9]/.test(inputValue)) {
      return
    }

    onChange(e.target.value)
  }

  return (
    <div className="bg-background-dark flex items-center rounded-lg h-10">
      <input
        className={clsx(
          "p-2 px-4 text-sm bg-transparent placeholder:text-text placeholder:text-sm outline-none",
          small ? "w-[110px]" : "w-[360px]"
        )}
        type="text"
        onChange={change}
        placeholder={placeholder}
        value={value}
        maxLength={maxLength}
      />
      {subtext && <span className="text-sm pr-2">{subtext}</span>}
    </div>
  )
}

export default Input
