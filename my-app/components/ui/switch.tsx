// components/ui/switch.tsx
import * as React from "react"

interface SwitchProps {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}

export const Switch: React.FC<SwitchProps> = ({ checked, onCheckedChange }) => {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
      />
      <div
        className={`w-11 h-6 bg-gray-300 rounded-full shadow-inner transition-all duration-300 ease-in-out ${
          checked ? "bg-blue-600" : ""
        }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ease-in-out ${
            checked ? "translate-x-5" : "translate-x-1"
          }`}
        />
      </div>
    </label>
  )
}
