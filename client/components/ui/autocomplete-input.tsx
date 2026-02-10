"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface AutocompleteOption {
  value: string
  label: string
  description?: string
  metadata?: {
    role?: string
    company?: string
    location?: string
    phone?: string
    email?: string
  }
}

interface AutocompleteInputProps {
  options: AutocompleteOption[]
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
  showOnFocus?: boolean  // If false, only show dropdown after typing at least minLength characters
  maxResults?: number  // Maximum number of suggestions to show in dropdown
  minLength?: number  // Minimum characters to type before showing dropdown (only applies when showOnFocus=false)
  disabled?: boolean  // Disable the input field
}

export function AutocompleteInput({
  options,
  value = "",
  onValueChange,
  placeholder = "Type here...",
  className,
  id,
  onKeyDown: customOnKeyDown,
  showOnFocus = true,  // Default to true for backward compatibility
  maxResults,  // Optional limit on number of results
  minLength = 1,  // Default to 1 character minimum
  disabled = false,  // Default to false
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
      // Apply maxResults limit if specified
      setFilteredOptions(maxResults ? filtered.slice(0, maxResults) : filtered)
    } else {
      // Apply maxResults limit even when showing all options
      setFilteredOptions(maxResults ? options.slice(0, maxResults) : options)
    }
  }, [inputValue, options, maxResults])

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
    
    // Only show suggestions if input length >= minLength when showOnFocus is false
    if (!showOnFocus) {
      setShowSuggestions(newValue.length >= minLength)
    } else {
      setShowSuggestions(true)
    }
    
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
        onFocus={() => {
          // Only show suggestions on focus if showOnFocus is true
          if (showOnFocus) {
            setShowSuggestions(true)
          }
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        disabled={disabled}
      />
      {showSuggestions && filteredOptions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-80 overflow-auto">
          <div className="py-1">
            {filteredOptions.map((option, index) => (
              <div
                key={option.value}
                onClick={() => handleSelectOption(option)}
                className={cn(
                  "px-3 py-2 cursor-pointer rounded-md mx-1",
                  index === selectedIndex
                    ? "bg-blue-400 text-white"
                    : "hover:bg-blue-100"
                )}
              >
                <div className="font-medium text-sm">{option.label}</div>
                {option.metadata && (
                  <div className={cn(
                    "text-xs mt-1 space-y-0.5",
                    index === selectedIndex ? "text-blue-50" : "text-slate-600"
                  )}>
                    {option.metadata.role && (
                      <div>🎯 {option.metadata.role}</div>
                    )}
                    {option.metadata.company && (
                      <div>🏢 {option.metadata.company}</div>
                    )}
                    {option.metadata.location && (
                      <div>📍 {option.metadata.location}</div>
                    )}
                    {option.metadata.phone && (
                      <div>📞 {option.metadata.phone}</div>
                    )}
                    {option.metadata.email && (
                      <div>📧 {option.metadata.email}</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
