"use client"

import * as React from "react"
import { type Icon } from "@tabler/icons-react"

import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type ButtonVariantsConfig = NonNullable<Parameters<typeof buttonVariants>[0]>
type ButtonVariant = NonNullable<ButtonVariantsConfig["variant"]>

export type ToolbarButtonConfig = {
  key: string
  label: string
  onClick?: () => void
  variant?: ButtonVariant
  icon?: Icon
  disabled?: boolean
}

export type SearchFiltersState = {
  keyword: string
  [key: string]: string | undefined
}

export type StatusOption = {
  value: string
  label: string
}

export type FilterFieldConfig = 
  | {
      type: "date"
      key: string
      label: string
    }
  | {
      type: "select"
      key: string
      label: string
      options: StatusOption[]
    }
  | {
      type: "text"
      key: string
      label: string
      placeholder?: string
    }

interface ToolbarWithFiltersProps {
  buttons: ToolbarButtonConfig[]
  filters: SearchFiltersState
  onFiltersChange: (filters: SearchFiltersState) => void
  onSearch: () => void
  labels: {
    keywordPlaceholder: string
    search: string
  }
  filterFields?: FilterFieldConfig[]
  isSearching?: boolean
}

export function ToolbarWithFilters({
  buttons,
  filters,
  onFiltersChange,
  onSearch,
  labels,
  filterFields = [],
  isSearching,
}: ToolbarWithFiltersProps) {
  const handleChange = (field: string, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    })
  }

  const renderFilterField = (field: FilterFieldConfig) => {
    switch (field.type) {
      case "date":
        return (
          <div key={field.key} className="flex flex-col gap-1">
            <Label htmlFor={field.key} className="text-xs text-muted-foreground">
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="date"
              value={filters[field.key] ?? ""}
              onChange={(event) => handleChange(field.key, event.target.value)}
            />
          </div>
        )
      case "select":
        return (
          <div key={field.key} className="flex flex-col gap-1">
            <Label htmlFor={field.key} className="text-xs text-muted-foreground">
              {field.label}
            </Label>
            <Select
              value={filters[field.key] ?? ""}
              onValueChange={(value) => handleChange(field.key, value)}
            >
              <SelectTrigger id={field.key}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {field.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case "text":
        return (
          <div key={field.key} className="flex flex-col gap-1">
            <Label htmlFor={field.key} className="text-xs text-muted-foreground">
              {field.label}
            </Label>
            <Input
              id={field.key}
              type="text"
              placeholder={field.placeholder}
              value={filters[field.key] ?? ""}
              onChange={(event) => handleChange(field.key, event.target.value)}
            />
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card/50 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-wrap gap-2">
        {buttons.map((button) => {
          const IconComponent = button.icon
          return (
            <Button
              key={button.key}
              type="button"
              variant={button.variant}
              onClick={button.onClick}
              disabled={button.disabled}
              className="min-w-[80px]"
            >
              {IconComponent && <IconComponent className="mr-1.5 h-4 w-4" />}
              {button.label}
            </Button>
          )
        })}
      </div>
      <div className="flex w-full flex-col gap-3 md:w-auto">
        {filterFields.length > 0 && (
          <div className={`grid gap-3 ${filterFields.length === 1 ? "md:grid-cols-1" : filterFields.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
            {filterFields.map(renderFilterField)}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSearch()
          }}
          className="flex flex-col gap-2 md:flex-row md:items-center"
        >
          <Input
            placeholder={labels.keywordPlaceholder}
            value={filters.keyword}
            onChange={(event) => handleChange("keyword", event.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                onSearch()
              }
            }}
            className="md:min-w-[240px]"
          />
          <Button
            type="submit"
            className="md:w-auto"
            disabled={isSearching}
          >
            {labels.search}
          </Button>
        </form>
      </div>
    </div>
  )
}

