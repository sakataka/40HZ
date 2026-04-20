export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatDurationLabel(minutes: number): string {
  return `${minutes} min`;
}

export function formatOutputMode(value: 'headphones' | 'speaker'): string {
  return value === 'headphones' ? 'Headphones' : 'Speakers';
}

export function formatSensitivity(value: 'standard' | 'sensitive'): string {
  return value === 'sensitive' ? 'Sensitive' : 'Standard';
}
