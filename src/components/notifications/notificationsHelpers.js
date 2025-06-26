export function getUserChatDuration(username, actionTime) {
  // Retrieve stored user data and find the target user by login
  const user = Object.values(JSON.parse(localStorage.getItem('fetchedUsers') || '[]'))
    .find(u => u?.login === username);
  if (!user) return `❌ User "${username}" not found`;

  const actionLog = user.actionLog || [];
  const current = actionLog.find(entry => entry.timestamp === actionTime);
  if (!current) return `Action not found at ${actionTime}`;

  const actionIndex = actionLog.indexOf(current);
  if (actionIndex === 0) return `🙌 ${username}'s first action`;

  // Find the most recent action before the current one that has a different type
  const prev = actionLog.slice(0, actionIndex).reverse().find(a => a.type !== current.type);
  if (!prev) return `❌ No valid previous action found for ${actionTime}`;

  // Calculate the duration between the two timestamps
  const duration = calculateDuration(prev.timestamp, current.timestamp);
  return current.type === 'leave'
    ? `🛑 ${username} stayed in chat for ${duration}`
    : `✅ ${username} was absent for ${duration}`;
}

function calculateDuration(start, end) {
  const toSeconds = t => t.split(':').reduce((acc, val, i) =>
    acc + val * [3600, 60, 1][i], 0); // Convert HH:MM:SS to total seconds

  const diff = Math.abs(toSeconds(end) - toSeconds(start)); // Get absolute difference in seconds

  return [
    Math.floor(diff / 3600), // Hours
    Math.floor((diff % 3600) / 60), // Minutes
    diff % 60 // Seconds
  ].map(n => n.toString().padStart(2, '0')).join(':'); // Format as HH:MM:SS
}

export function isVisibleInContainer(el, container) {
  const containerRect = container.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();
  return (
    elRect.top >= containerRect.top &&
    elRect.bottom <= containerRect.bottom
  );
}