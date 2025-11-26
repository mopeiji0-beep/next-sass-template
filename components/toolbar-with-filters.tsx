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
  status: "all" | "active" | "inactive"
  dateFrom?: string
  dateTo?: string
}

export type StatusOption = {
  value: SearchFiltersState["status"]
  label: string
}

interface ToolbarWithFiltersProps {
  buttons: ToolbarButtonConfig[]
  filters: SearchFiltersState
  onFiltersChange: (filters: SearchFiltersState) => void
  onSearch: () => void
  labels: {
    keywordPlaceholder: string
    statusLabel: string
    statusOptions: StatusOption[]
    dateFrom: string
    dateTo: string
    search: string
  }
  isSearching?: boolean
}

export function ToolbarWithFilters({
  buttons,
  filters,
  onFiltersChange,
  onSearch,
  labels,
  isSearching,
}: ToolbarWithFiltersProps) {
  const handleChange = (field: keyof SearchFiltersState, value: string) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    })
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
        <div className="grid gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <Label htmlFor="date-from" className="text-xs text-muted-foreground">
              {labels.dateFrom}
            </Label>
            <Input
              id="date-from"
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(event) => handleChange("dateFrom", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="date-to" className="text-xs text-muted-foreground">
              {labels.dateTo}
            </Label>
            <Input
              id="date-to"
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(event) => handleChange("dateTo", event.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">
              {labels.statusLabel}
            </Label>
            <Select
              value={filters.status}
              onValueChange={(value) =>
                handleChange("status", value as SearchFiltersState["status"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {labels.statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <Input
            placeholder={labels.keywordPlaceholder}
            value={filters.keyword}
            onChange={(event) => handleChange("keyword", event.target.value)}
            className="md:min-w-[240px]"
          />
          <Button
            type="button"
            className="md:w-auto"
            onClick={onSearch}
            disabled={isSearching}
          >
            {labels.search}
          </Button>
        </div>
      </div>
    </div>
  )
}

