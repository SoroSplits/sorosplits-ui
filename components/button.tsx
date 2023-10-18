import { useMemo } from "react"

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
        return "bg-black text-white"
      case "primary":
        return "bg-red-300 text-white"
      case "secondary":
        return "border-red-200 border-2"
    }
  }, [type])

  return (
    <button
      className={`button w-40 h-10 flex items-center justify-center py-2 px-4 rounded-lg ${buttonColor}`}
      onClick={onClick}
    >
      {text}
    </button>
  )
}

export default Button
