import type { TemplateIconName } from '../components/TemplateIcon'

export type ListTemplate = {
  id: string
  label: string
  gradientFrom: string
  gradientTo: string
  icon: TemplateIconName
}

export const LIST_TEMPLATES: ListTemplate[] = [
  { id: 'meditacion', label: 'Meditación', gradientFrom: '#1D9E75', gradientTo: '#0F6E56', icon: 'yinyang' },
  { id: 'hipnosis', label: 'Hipnosis', gradientFrom: '#7F77DD', gradientTo: '#3C3489', icon: 'spiral' },
  { id: 'reprogramacion', label: 'Reprogramación', gradientFrom: '#378ADD', gradientTo: '#0C447C', icon: 'refresh' },
  { id: 'subliminales', label: 'Subliminales', gradientFrom: '#D4537E', gradientTo: '#72243E', icon: 'wave-sine' },
  { id: 'mantras', label: 'Mantras', gradientFrom: '#EF9F27', gradientTo: '#854F0B', icon: 'om' },
  { id: 'dormir', label: 'Para dormir', gradientFrom: '#26215C', gradientTo: '#042C53', icon: 'moon' },
  { id: 'ansiedad', label: 'Ansiedad', gradientFrom: '#5DCAA5', gradientTo: '#0F6E56', icon: 'wind' },
  { id: 'motivacion', label: 'Motivación', gradientFrom: '#D85A30', gradientTo: '#712B13', icon: 'flame' },
]

export const CUSTOM_TEMPLATE_ID = 'personalizada'

export const CUSTOM_TEMPLATE: ListTemplate = {
  id: CUSTOM_TEMPLATE_ID,
  label: 'Personalizada',
  gradientFrom: '#3A3B40',
  gradientTo: '#1B1C1F',
  icon: 'lista',
}

export function getTemplateById(id: string): ListTemplate {
  return LIST_TEMPLATES.find((template) => template.id === id) ?? CUSTOM_TEMPLATE
}
