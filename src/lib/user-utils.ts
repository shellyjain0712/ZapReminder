/**
 * Utility functions for user-related operations
 */

/**
 * Formats a user's display name from their name or email
 * If name is not available or is generic "User", extracts a formatted name from email
 */
export function formatDisplayName(name: string | null | undefined, email: string | null | undefined): string {
  if (name && name !== 'User') return name;
  
  if (email) {
    const username = email.split('@')[0];
    if (username) {
      // Remove numbers and format camelCase/PascalCase to readable name
      return username
        .replace(/[0-9]/g, '') // Remove numbers
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
        .split(/[-_.]/g) // Split on common separators
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ')
        .trim() || 'User';
    }
  }
  
  return 'User';
}

/**
 * Gets the user's initials for avatar display
 */
export function getUserInitials(name: string | null | undefined, email: string | null | undefined): string {
  const displayName = formatDisplayName(name, email);
  
  // If it's a multi-word name, get first letter of each word (max 2)
  const words = displayName.split(' ').filter(word => word.length > 0);
  if (words.length > 1) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
  }
  
  // Single word, return first letter
  return displayName.charAt(0).toUpperCase();
}
