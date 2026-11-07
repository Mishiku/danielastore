import nodemailer from 'nodemailer';
import { env } from '../../config/env';

export interface OrderEmailData {
  orderId: number;
  orderedAt: string;
  customerEmail: string;
  phone: string;
  products: { id: number; name: string; price: number }[];
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

const transporter = env.smtp.host
  ? nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined
    })
  : null;

const hasAddress = (value: string) => /<[^<>\s@]+@[^<>\s@]+>$|^[^<>\s@]+@[^<>\s@]+$/.test(value.trim());

if (transporter && !hasAddress(env.smtp.from)) {
  console.warn(`SMTP_FROM "${env.smtp.from}" is not a valid email address (use e.g. "Tienda <postmaster@your-domain.mailgun.org>"); receivers will likely drop the mail`);
}

export async function sendOrderNotification(recipients: string[], order: OrderEmailData) {
  if (recipients.length === 0) {
    console.warn(`Order #${order.orderId}: no notification emails configured (Admin > Settings); email skipped`);
    return;
  }
  if (!transporter) {
    console.warn('SMTP_HOST is not configured; order notification email skipped');
    return;
  }

  const total = order.products.reduce((sum, product) => sum + product.price, 0);
  const money = (value: number) => `$${value.toFixed(2)}`;
  const text = [
    `Nueva compra #${order.orderId}`,
    `Fecha: ${order.orderedAt}`,
    `Cliente: ${order.customerEmail}`,
    `Teléfono: ${order.phone}`,
    '',
    'Productos:',
    ...order.products.map((product) => `- ${product.name}: ${money(product.price)}`),
    '',
    `Total: ${money(total)}`
  ].join('\n');

  const html = `
    <h2>Nueva compra #${order.orderId}</h2>
    <p><strong>Fecha:</strong> ${escapeHtml(order.orderedAt)}<br>
    <strong>Cliente:</strong> ${escapeHtml(order.customerEmail)}<br>
    <strong>Teléfono:</strong> ${escapeHtml(order.phone)}</p>
    <table cellpadding="6" style="border-collapse:collapse">
      <tr><th align="left">Producto</th><th align="right">Precio</th></tr>
      ${order.products.map((product) => `<tr><td>${escapeHtml(product.name)}</td><td align="right">${money(product.price)}</td></tr>`).join('')}
      <tr><td><strong>Total</strong></td><td align="right"><strong>${money(total)}</strong></td></tr>
    </table>`;

  const info = await transporter.sendMail({
    from: env.smtp.from,
    to: recipients,
    subject: `Nueva compra #${order.orderId}`,
    text,
    html
  });
  console.log(`Order #${order.orderId}: notification sent to ${recipients.join(', ')} (accepted: ${info.accepted.join(', ') || 'none'}, rejected: ${info.rejected.join(', ') || 'none'})`);
}
