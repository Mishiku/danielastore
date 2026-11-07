import { dbGet, dbRun } from '../../database/connection';

const ADMIN_EMAILS_KEY = 'admin_notification_emails';

export async function getNotificationEmails(): Promise<string[]> {
  const row = await dbGet<{ value: string }>('SELECT value FROM settings WHERE key = ?', [ADMIN_EMAILS_KEY]);
  if (!row) return [];
  try {
    const parsed = JSON.parse(row.value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveNotificationEmails(emails: string[]) {
  await dbRun(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    [ADMIN_EMAILS_KEY, JSON.stringify(emails)]
  );
}
