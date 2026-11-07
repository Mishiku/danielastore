import type { Request, Response } from 'express';
import { getNotificationEmails, saveNotificationEmails } from './settings.repository';

const EMAIL_PATTERN = /^[^\s@,;<>]+@[^\s@,;<>]+\.[^\s@,;<>]+$/;

export async function getSettings(_req: Request, res: Response) {
  try {
    res.json({ notificationEmails: await getNotificationEmails() });
  } catch (error) {
    console.error('Unable to load settings', error);
    res.status(500).json({ error: 'Unable to load settings' });
  }
}

export async function updateSettings(req: Request, res: Response) {
  const raw: unknown = req.body.notificationEmails;
  if (!Array.isArray(raw) || raw.some((email) => typeof email !== 'string')) {
    return res.status(400).json({ error: 'notificationEmails must be a list of emails' });
  }

  const emails = [...new Set((raw as string[]).map((email) => email.trim().toLowerCase()).filter(Boolean))];
  const invalid = emails.find((email) => email.length > 254 || !EMAIL_PATTERN.test(email));
  if (invalid) return res.status(400).json({ error: `Invalid email: ${invalid}` });

  try {
    await saveNotificationEmails(emails);
    res.json({ notificationEmails: emails });
  } catch (error) {
    console.error('Unable to save settings', error);
    res.status(500).json({ error: 'Unable to save settings' });
  }
}
