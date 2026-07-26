'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Trash2 } from 'lucide-react'

interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  type?: 'text' | 'email' | 'tel' | 'date' | 'number'
  maxLength?: number
  hint?: string
}

export function TextField({ label, value, onChange, required, placeholder, type = 'text', maxLength, hint }: TextFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/80">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="h-10"
      />
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  )
}

interface TextAreaFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  placeholder?: string
  rows?: number
}

export function TextAreaField({ label, value, onChange, required, placeholder, rows = 3 }: TextAreaFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/80">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="resize-none"
      />
    </div>
  )
}

interface SelectFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  required?: boolean
  placeholder?: string
}

export function SelectField({ label, value, onChange, options, required, placeholder = 'Selecciona...' }: SelectFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/80">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-10">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface BooleanFieldProps {
  label: string
  value: boolean | null
  onChange: (value: boolean) => void
  required?: boolean
  options?: { yes: string; no: string }
}

export function BooleanField({ label, value, onChange, required, options }: BooleanFieldProps) {
  const yesLabel = options?.yes ?? 'Sí'
  const noLabel = options?.no ?? 'No'
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-foreground/80">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      <RadioGroup
        value={value === null ? '' : value ? 'yes' : 'no'}
        onValueChange={(v) => onChange(v === 'yes')}
        className="flex gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="yes" id={`${label}-yes`} />
          <Label htmlFor={`${label}-yes`} className="text-sm cursor-pointer">{yesLabel}</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="no" id={`${label}-no`} />
          <Label htmlFor={`${label}-no`} className="text-sm cursor-pointer">{noLabel}</Label>
        </div>
      </RadioGroup>
    </div>
  )
}

interface RepeatableListProps<T> {
  items: T[]
  onAdd: () => void
  onRemove: (id: string) => void
  renderItem: (item: T, index: number) => React.ReactNode
  addLabel: string
  maxItems?: number
}

export function RepeatableList<T extends { id: string }>({
  items,
  onAdd,
  onRemove,
  renderItem,
  addLabel,
  maxItems,
}: RepeatableListProps<T>) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={item.id} className="relative rounded-lg border border-border bg-card p-3">
          <div className="space-y-3">
            {renderItem(item, index)}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => onRemove(item.id)}
            aria-label="Eliminar"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      {(!maxItems || items.length < maxItems) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
          className="w-full border-dashed"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          {addLabel}
        </Button>
      )}
    </div>
  )
}

export function StepDivider({ label }: { label: string }) {
  return (
    <div className="pt-4 pb-2">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/60">{label}</h3>
    </div>
  )
}

export function InfoNote({ children, variant = 'info' }: { children: React.ReactNode; variant?: 'info' | 'success' | 'warning' }) {
  const variants = {
    info: 'bg-primary/5 border-primary/20 text-primary',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
  }
  return (
    <div className={`rounded-md border px-3 py-2 text-xs ${variants[variant]}`}>
      {children}
    </div>
  )
}
