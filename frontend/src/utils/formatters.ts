/**
 * Format a number as currency (USD)
 */
export function formatCurrency(value: number, decimals = 2): string {
  return `$${value.toFixed(decimals)}`;
}

/**
 * Format a number with commas and decimal places
 */
export function formatNumber(value: number, decimals = 1): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format watts value
 */
export function formatWatts(value: number): string {
  return `${Math.round(value)}W`;
}

/**
 * Format carbon intensity
 */
export function formatCarbon(value: number): string {
  return Math.round(value).toString();
}

/**
 * Format timestamp to short time string (HH:MM:SS)
 */
export function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  } catch {
    return '';
  }
}

/**
 * Format percentage
 */
export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/**
 * Get color class based on carbon intensity level
 */
export function getCarbonColor(intensity: number): 'green' | 'orange' | 'red' {
  if (intensity < 200) return 'green';
  if (intensity < 400) return 'orange';
  return 'red';
}

/**
 * Get color class based on training status
 */
export function getStatusColor(status: string): 'green' | 'yellow' | 'blue' | 'red' | 'orange' {
  switch (status) {
    case 'running':
      return 'green';
    case 'paused':
      return 'yellow';
    case 'completed':
      return 'blue';
    case 'idle':
    default:
      return 'orange';
  }
}

/**
 * Format training status for display
 */
export function formatStatus(status: string): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
