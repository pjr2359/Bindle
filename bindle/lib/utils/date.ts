/**
 * Format a date string to display time in HH:MM format
 */
export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

/**
 * Format a date string to display date as "Mon DD" format
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
};

/**
 * Format duration in minutes to "XhXm" format
 */
export const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

/**
 * Format arrival day offset for flights: +1, +2, +3 or -1
 */
export const formatArrivalDayOffset = (offset: number): string => {
  if (offset > 0) return `+${offset}`;
  return String(offset);
};