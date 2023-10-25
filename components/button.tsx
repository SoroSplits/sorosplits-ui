import { useMemo } from "react"
import { clsx } from 'clsx'

type ButtonType = "wallet" | "primary" | "secondary"

interface ButtonProps {
  text: string
  onClick: () => void
  type: ButtonType
}

const Button = ({ text, onClick, type }: ButtonProps) => {
  const buttonColor = useMemo(() => {
    switch (type) {
      case "wallet":
        return "bg-accent text-white hover:bg-accent-dark"
      case "primary":
        return "bg-primary text-text hover:bg-primary-dark"
      case "secondary":
        return "bg-secondary text-text"
    }
  }, [type])

  return (
    <button
      className={clsx(
        "button w-40 h-9 flex items-center justify-center py-2 px-4 rounded-lg",
        "",
        buttonColor,
      )}
      onClick={onClick}
    >
      <span className="text-sm">
        {text}
      </span>
    </button>
  )
}

export default Button
