// Removed @capacitor/local-notifications to remove SCHEDULE_EXACT_ALARM permissions

export const WEEKLY_MIX_ID = 1001;
export const RETENTION_NUDGE_ID = 1002;

export async function requestNotificationPermissions() {
  return;
}

export async function scheduleWeeklyMix() {
  return;
}

export async function scheduleRetentionNudge(lastPlayedTitle: string) {
  return;
}

export async function cancelRetentionNudges() {
  return;
}
