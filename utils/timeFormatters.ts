// src/utils/timeFormatters.ts

/**
 * Formats a Unix timestamp (in seconds) to a consistent human-readable format
 * @param unixSeconds - Unix timestamp in seconds
 * @param includeDate - Whether to include the date in the output
 * @returns Formatted date/time string
 */
export const formatTimestamp = (unixSeconds: number | undefined, includeDate: boolean = true): string => {
    if (!unixSeconds) return 'Unknown';

    // Convert seconds to milliseconds for JavaScript Date
    const date = new Date(unixSeconds * 1000);

    if (includeDate) {
        return date.toLocaleString('en-US', {
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    } else {
        // Time only format
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }
};

/**
 * Formats a relative time value (milliseconds) to a human-readable string
 * @param milliseconds - Number of milliseconds
 * @returns Formatted relative time string (e.g. "3.2s ago" or "450ms ago")
 */
export const formatRelativeTime = (milliseconds: number): string => {
    if (milliseconds < 1000) {
        return `${milliseconds}ms ago`;
    } else if (milliseconds < 60000) {
        return `${(milliseconds / 1000).toFixed(1)}s ago`;
    } else if (milliseconds < 3600000) {
        return `${Math.floor(milliseconds / 60000)}m ${Math.floor((milliseconds % 60000) / 1000)}s ago`;
    } else {
        return `${Math.floor(milliseconds / 3600000)}h ${Math.floor((milliseconds % 3600000) / 60000)}m ago`;
    }
};

/**
 * Formats a time value for chart axis display (shorter format)
 * @param unixSeconds - Unix timestamp in seconds
 * @returns Formatted time string (HH:MM)
 */
export const formatTimeAxis = (unixSeconds: number): string => {
    const date = new Date(unixSeconds * 1000);
    return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

/**
 * Formats a date for compact display
 * @param unixSeconds - Unix timestamp in seconds
 * @returns Formatted date string (MM/DD/YY)
 */
export const formatDateCompact = (unixSeconds: number): string => {
    const date = new Date(unixSeconds * 1000);
    return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
    });
};