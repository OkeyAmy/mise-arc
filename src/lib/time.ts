
export const getUserTimezone = (): string => {
  try {
    // Return the user's timezone from browser settings
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch (e) {
    console.error("Could not determine user timezone, falling back to UTC.", e);
    return "UTC"; // Fallback to UTC if timezone is not available
  }
};

export const getFormattedUserTime = (): string => {
  const timezone = getUserTimezone();
  const now = new Date();
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZone: timezone,
    timeZoneName: 'short',
  };
  try {
    // Using 'en-US' locale for a consistent format, but it will use the user's timezone.
    return new Intl.DateTimeFormat('en-US', options).format(now);
  } catch (e) {
    console.error("Could not format user time, falling back to ISO string.", e);
    // Fallback to a simpler, timezone-aware format if Intl fails for some reason
    return `${now.toLocaleDateString()} ${now.toLocaleTimeString()} (${timezone})`;
  }
};
