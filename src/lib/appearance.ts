import {
  Briefcase,
  FileText,
  FileSpreadsheet,
  FileType2,
  FileCode2,
  Presentation,
  Target,
  Rocket,
  GraduationCap,
  Home,
  Scale,
  Palette,
  Landmark,
  HeartPulse,
  Plane,
  Building2,
  BookOpen,
  Lightbulb,
  type LucideIcon,
} from 'lucide-react';
import type { DocumentFormat, TopicAccent } from './types';

/** Topic accents — muted, so a wall of topic cards never becomes a colour grid. */
export const TOPIC_ACCENTS: Record<
  TopicAccent,
  { label: string; solid: string; soft: string; border: string; text: string }
> = {
  indigo: { label: 'Indigo', solid: '#5a4fe0', soft: 'rgba(90,79,224,0.12)', border: 'rgba(90,79,224,0.28)', text: '#5a4fe0' },
  violet: { label: 'Violet', solid: '#8b4fd0', soft: 'rgba(139,79,208,0.12)', border: 'rgba(139,79,208,0.28)', text: '#8b4fd0' },
  teal: { label: 'Teal', solid: '#12897a', soft: 'rgba(18,137,122,0.12)', border: 'rgba(18,137,122,0.28)', text: '#12897a' },
  amber: { label: 'Amber', solid: '#b47411', soft: 'rgba(180,116,17,0.13)', border: 'rgba(180,116,17,0.28)', text: '#b47411' },
  rose: { label: 'Rose', solid: '#c1466b', soft: 'rgba(193,70,107,0.12)', border: 'rgba(193,70,107,0.28)', text: '#c1466b' },
  sky: { label: 'Sky', solid: '#2a7bb8', soft: 'rgba(42,123,184,0.12)', border: 'rgba(42,123,184,0.28)', text: '#2a7bb8' },
  lime: { label: 'Lime', solid: '#5d8a1c', soft: 'rgba(93,138,28,0.13)', border: 'rgba(93,138,28,0.28)', text: '#5d8a1c' },
  slate: { label: 'Slate', solid: '#5b6472', soft: 'rgba(91,100,114,0.12)', border: 'rgba(91,100,114,0.28)', text: '#5b6472' },
};

export const ACCENT_KEYS = Object.keys(TOPIC_ACCENTS) as TopicAccent[];

/** Icon keys stored on the Topic; resolved here so storage stays serialisable. */
export const TOPIC_ICONS: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  target: Target,
  rocket: Rocket,
  graduation: GraduationCap,
  home: Home,
  scale: Scale,
  palette: Palette,
  bank: Landmark,
  health: HeartPulse,
  plane: Plane,
  building: Building2,
  book: BookOpen,
  idea: Lightbulb,
};

export const TOPIC_ICON_KEYS = Object.keys(TOPIC_ICONS);

export function topicIcon(key: string): LucideIcon {
  return TOPIC_ICONS[key] ?? TOPIC_ICONS.briefcase;
}

export function accentOf(accent: TopicAccent) {
  return TOPIC_ACCENTS[accent] ?? TOPIC_ACCENTS.indigo;
}

/** File-type presentation: icon + short label + tint. */
export const FORMAT_META: Record<
  DocumentFormat,
  { label: string; icon: LucideIcon; color: string }
> = {
  pdf: { label: 'PDF', icon: FileType2, color: '#c0392b' },
  docx: { label: 'DOCX', icon: FileText, color: '#2b5797' },
  doc: { label: 'DOC', icon: FileText, color: '#2b5797' },
  txt: { label: 'TXT', icon: FileText, color: '#5b6472' },
  md: { label: 'MD', icon: FileCode2, color: '#37787a' },
  xlsx: { label: 'XLSX', icon: FileSpreadsheet, color: '#1e7145' },
  csv: { label: 'CSV', icon: FileSpreadsheet, color: '#1e7145' },
  pptx: { label: 'PPTX', icon: Presentation, color: '#b7472a' },
  rtf: { label: 'RTF', icon: FileText, color: '#5b6472' },
  other: { label: 'FILE', icon: FileText, color: '#5b6472' },
};

export function formatMeta(format: DocumentFormat) {
  return FORMAT_META[format] ?? FORMAT_META.other;
}
