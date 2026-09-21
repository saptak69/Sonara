import { LocalNotifications } from '@capacitor/local-notifications';

export const WEEKLY_MIX_ID = 1001;
export const RETENTION_NUDGE_ID = 1002;

export async function requestNotificationPermissions() {
  try {
    const { display } = await LocalNotifications.checkPermissions();
    if (display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }
  } catch (error) {
    console.error('Error requesting notification permissions', error);
  }
}

export async function scheduleWeeklyMix() {
  try {
    const permissions = await LocalNotifications.checkPermissions();
    if (permissions.display !== 'granted') return;

    // Check if it's already scheduled
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.some((n) => n.id === WEEKLY_MIX_ID)) {
      return;
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          id: WEEKLY_MIX_ID,
          title: "Your Weekly Mix is Ready \uD83C\uDFB5",
          body: "Tap to listen to a fresh playlist curated just for you.",
          schedule: {
            // Schedule for Monday at 9:00 AM every week
            on: {
              weekday: 2, // 1 = Sunday, 2 = Monday
              hour: 9,
              minute: 0,
            },
            allowWhileIdle: true,
          },
          actionTypeId: "WEEKLY_MIX",
          extra: {
            action: "WEEKLY_MIX"
          }
        },
      ],
    });
  } catch (error) {
    console.error('Error scheduling weekly mix', error);
  }
}

export async function scheduleRetentionNudge(lastPlayedTitle: string) {
  try {
    const permissions = await LocalNotifications.checkPermissions();
    if (permissions.display !== 'granted') return;

    // Cancel existing
    await cancelRetentionNudges();

    const date = new Date();
    // Schedule for exactly 3 days from now
    date.setDate(date.getDate() + 3);

    await LocalNotifications.schedule({
      notifications: [
        {
          id: RETENTION_NUDGE_ID,
          title: "Miss the music? \uD83C\uDFA7",
          body: `Jump back in and listen to ${lastPlayedTitle} or discover something new.`,
          schedule: {
            at: date,
            allowWhileIdle: true,
          },
          actionTypeId: "RETENTION_NUDGE",
          extra: {
            action: "RETENTION_NUDGE"
          }
        },
      ],
    });
  } catch (error) {
    console.error('Error scheduling retention nudge', error);
  }
}

export async function cancelRetentionNudges() {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: RETENTION_NUDGE_ID }],
    });
  } catch (error) {
    console.error('Error cancelling retention nudge', error);
  }
}
