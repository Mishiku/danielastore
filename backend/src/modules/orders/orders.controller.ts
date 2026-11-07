import type { Request, Response } from 'express';
import { findProductSummariesByIds } from '../products/products.repository';
import { sendOrderNotification } from '../mail/mail.service';
import { getNotificationEmails } from '../settings/settings.repository';
import { findOrderById, insertOrder } from './orders.repository';

const PHONE_PATTERN = /^[0-9+() .-]{7,20}$/;

export async function createOrder(req: Request, res: Response) {
  const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
  const productIds: unknown[] = Array.isArray(req.body.products) ? req.body.products : [];

  if (!PHONE_PATTERN.test(phone) ||
      productIds.length === 0 ||
      productIds.some((id) => !Number.isInteger(id) || (id as number) <= 0) ||
      new Set(productIds).size !== productIds.length) {
    return res.status(400).json({ error: 'A valid phone number and at least one product are required' });
  }

  try {
    const products = await findProductSummariesByIds(productIds as number[]);

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more selected products are unavailable' });
    }

    const orderId = await insertOrder(req.user!.id, phone, products);
    const order = await findOrderById(orderId);

    getNotificationEmails()
      .then((recipients) => sendOrderNotification(recipients, {
        orderId,
        orderedAt: order?.ordered_at ?? new Date().toISOString(),
        customerEmail: req.user!.email,
        phone,
        products
      }))
      .catch((error) => console.error('Unable to send order notification email', error));

    res.status(201).json(order);
  } catch (error) {
    console.error('Unable to create order', error);
    res.status(500).json({ error: 'Unable to create order' });
  }
}
