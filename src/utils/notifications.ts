import * as Notifications from 'expo-notifications';
import { settingsRepo } from '../database/repositories';
import { sessionManager } from './session';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  const hasPermission = await requestNotificationPermissions();
  if (!hasPermission) return;

  const settings = await settingsRepo.getNotificationSettings();
  const userId = sessionManager.getCurrentUserId();

  if (settings.workout_reminder.enabled) {
    const [hour, minute] = settings.workout_reminder.time.split(':').map(Number);
    const trigger = new Date();
    trigger.setHours(hour, minute, 0, 0);
    if (trigger <= new Date()) trigger.setDate(trigger.getDate() + 1);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Workout Reminder',
        body: "Time to hit the gym! Don't break your streak.",
        data: { userId, type: 'workout' },
      },
      trigger: { date: trigger, repeats: true },
    });
  }

  if (settings.meal_logging_reminder.enabled) {
    const [hour, minute] = settings.meal_logging_reminder.time.split(':').map(Number);
    const trigger = new Date();
    trigger.setHours(hour, minute, 0, 0);
    if (trigger <= new Date()) trigger.setDate(trigger.getDate() + 1);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Meal Reminder',
        body: "Don't forget to log your meals today!",
        data: { userId, type: 'meal' },
      },
      trigger: { date: trigger, repeats: true },
    });
  }

  if (settings.hydration_reminder.enabled) {
    const intervalMinutes = settings.hydration_reminder.interval_minutes;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hydration Reminder',
        body: 'Time to drink some water!',
        data: { userId, type: 'hydration' },
      },
      trigger: { seconds: intervalMinutes * 60, repeats: true },
    });
  }

  if (settings.measurement_reminder.enabled) {
    const intervalDays = settings.measurement_reminder.interval_days;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Measurement Reminder',
        body: 'Take your body measurements to track progress!',
        data: { userId, type: 'measurement' },
      },
      trigger: { seconds: intervalDays * 24 * 60 * 60, repeats: true },
    });
  }

  if (settings.weekly_review_reminder.enabled) {
    const [hour, minute] = settings.weekly_review_reminder.time.split(':').map(Number);
    const daysMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
    };
    const targetDay = daysMap[settings.weekly_review_reminder.day] ?? 0;
    const trigger = new Date();
    const currentDay = trigger.getDay();
    let daysUntil = targetDay - currentDay;
    if (daysUntil <= 0) daysUntil += 7;
    trigger.setDate(trigger.getDate() + daysUntil);
    trigger.setHours(hour, minute, 0, 0);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly Review',
        body: 'Check out your weekly fitness summary!',
        data: { userId, type: 'weekly_review' },
      },
      trigger: { date: trigger, repeats: true },
    });
  }
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function getScheduledReminders(): Promise<Notifications.NotificationRequest[]> {
  return Notifications.getAllScheduledNotificationsAsync();
}
