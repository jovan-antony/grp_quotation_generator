"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface AutocompleteOption {
  value: string
  label: string
}

interface AutocompleteInputProps {
  options: AutocompleteOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}

export function AutocompleteInput({
  options,
  value = "",
  onValueChange,
  placeholder = "Type here...",
  className,
  id,
  onKeyDown: customOnKeyDown,
}: AutocompleteInputProps) {
  const [inputValue, setInputValue] = React.useState(value)
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const [filteredOptions, setFilteredOptions] = React.useState<AutocompleteOption[]>([])
  const [selectedIndex, setSelectedIndex] = React.useState(-1)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    setInputValue(value)
  }, [value])

  React.useEffect(() => {
    if (inputValue) {
      const filtered = options.filter((option) =>
        option.label.toLowerCase().includes(inputValue.toLowerCase())
      )
      setFilteredOptions(filtered)
    } else {
      setFilteredOptions(options)
    }
  }, [inputValue, options])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onValueChange?.(newValue)
    setShowSuggestions(true)
    setSelectedIndex(-1)
  }

  const handleSelectOption = (option: AutocompleteOption) => {
    setInputValue(option.value)
    onValueChange?.(option.value)
    setShowSuggestions(false)
    setSelectedIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || filteredOptions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault()
        setShowSuggestions(false)
        customOnKeyDown?.(e)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1))
        break
      case "Enter":
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
          handleSelectOption(filteredOptions[selectedIndex])
        } else {
          setShowSuggestions(false)
          customOnKeyDown?.(e)
        }
        break
      case "Escape":
        setShowSuggestions(false)
        setSelectedIndex(-1)
        break
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        ref={inputRef}
        id={id}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={() => setShowSuggestions(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {showSuggestions && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
          <div className="py-1">
            {filteredOptions.map((option, index) => (
              <div
                key={option.value}
                onClick={() => handleSelectOption(option)}
                className={cn(
                  "px-3 py-2 cursor-pointer text-sm rounded-md mx-1",
                  index === selectedIndex
                    ? "bg-blue-400 text-white"
                    : "hover:bg-blue-100"
                )}
              >
                {option.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
