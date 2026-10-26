import type { Order } from '@/types';

// Message texts are copied verbatim from the previous orders page. Do not reword.

/** WhatsApp link with the bilingual status update message (confirmed, shipped, delivered, cancelled), or null for other statuses. */
export function buildWhatsAppLink(order: Order, status: string): string | null {
  const phone = `961${order.customer.phone.replace(/^(\+961|00961|961)/, '').replace(/\s/g, '')}`;
  const firstName = order.customer.firstName;
  const orderNum = order.orderNumber;

  // Build items list for confirmed & cancelled
  const itemsAr = order.items.map((i) => {
    const box = i.box ? ` 📦 ${i.box.code ?? 'Box'}${i.box.price > 0 ? ` (+$${i.box.price.toFixed(2)})` : ' (Free)'}` : '';
    return `- ${i.productName} x${i.quantity}${box}`;
  }).join('\n');
  const itemsEn = order.items.map((i) => {
    const box = i.box ? ` 📦 ${i.box.code ?? 'Box'}${i.box.price > 0 ? ` (+$${i.box.price.toFixed(2)})` : ' (Free)'}` : '';
    return `- ${i.productName} x${i.quantity}${box}`;
  }).join('\n');

  const sep = '\n\n---\n\n';
  const messages: Record<string, string> = {
    confirmed:
      `\u0645\u0631\u062D\u0628\u0627\u064B ${firstName}! \u2705\n\n` +
      `\u0637\u0644\u0628\u0643 \u0631\u0642\u0645 ${orderNum} \u062A\u0645 \u062A\u0623\u0643\u064A\u062F\u0647 \u0645\u0646 \u0642\u0650\u0628\u064E\u0644 \u0641\u0631\u064A\u0642\u0646\u0627.\n` +
      `\u0646\u062D\u0646 \u0646\u062C\u0647\u0651\u0632 \u0637\u0644\u0628\u0643 \u0627\u0644\u0622\u0646 \u0644\u0644\u0634\u062D\u0646! \u{1F4E6}\n` +
      `\u{1F4C5} \u0645\u062F\u0629 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629: \u0628\u064A\u0646 3 \u0625\u0644\u0649 5 \u0623\u064A\u0627\u0645 \u0639\u0645\u0644.\n\n` +
      `\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A:\n\n${itemsAr}\n\n` +
      `\u0634\u0643\u0631\u0627\u064B \u0644\u062B\u0642\u062A\u0643 \u0628\u0646\u0627 \u{231A}\u{1F64F}\nskmeilb.com` +
      sep +
      `Hello ${firstName}! \u2705\n\n` +
      `Your order ${orderNum} has been confirmed by our team.\n` +
      `We are now preparing your order for shipment! \u{1F4E6}\n` +
      `\u{1F4C5} Estimated delivery: 3 to 5 business days.\n\n` +
      `Items:\n\n${itemsEn}\n\n` +
      `Thank you for choosing us \u{231A}\u{1F64F}\nskmeilb.com`,

    shipped:
      `\u0645\u0631\u062D\u0628\u0627\u064B ${firstName}! \u{1F69A}\n\n` +
      `\u0637\u0644\u0628\u0643 \u0631\u0642\u0645 ${orderNum} \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 \u0625\u0644\u064A\u0643 \u0627\u0644\u0622\u0646!\n` +
      `\u0633\u064A\u0635\u0644\u0643 \u0642\u0631\u064A\u0628\u0627\u064B \u2014 \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u062C\u062F \u0644\u0627\u0633\u062A\u0644\u0627\u0645\u0647.\n` +
      `\u{1F4C5} \u0645\u062F\u0629 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629: \u0628\u064A\u0646 2 \u0625\u0644\u0649 4 \u0623\u064A\u0627\u0645 \u0639\u0645\u0644.\n\n` +
      `\u0634\u0643\u0631\u0627\u064B \u0644\u062B\u0642\u062A\u0643 \u0628\u0646\u0627 \u{231A}\u{1F64F}\nskmeilb.com` +
      sep +
      `Hello ${firstName}! \u{1F69A}\n\n` +
      `Your order ${orderNum} is on its way!\n` +
      `It will arrive shortly \u2014 please be available to receive it.\n` +
      `\u{1F4C5} Estimated delivery: 2 to 4 business days.\n\n` +
      `Thank you for choosing us \u{231A}\u{1F64F}\nskmeilb.com`,

    delivered:
      `\u0623\u0647\u0644\u0627\u064B ${firstName}! \u{1F389}\n\n` +
      `\u062A\u0645 \u062A\u0648\u0635\u064A\u0644 \u0637\u0644\u0628\u0643 \u0628\u0646\u062C\u0627\u062D!\n` +
      `\u0646\u0623\u0645\u0644 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0633\u0639\u064A\u062F\u0627\u064B \u0628\u0645\u0634\u062A\u0631\u064A\u0627\u062A\u0643 \u{231A}\n\n` +
      `\u{1F4AC} \u0631\u0623\u064A\u0643 \u064A\u0647\u0645\u0646\u0627 \u2014 \u0634\u0627\u0631\u0643\u0646\u0627 \u062A\u062C\u0631\u0628\u062A\u0643!\n` +
      `\u{1F4F2} \u0627\u062D\u0641\u0638 \u0631\u0642\u0645\u0646\u0627 \u0644\u062A\u0635\u0644\u0643 \u0623\u062D\u062F\u062B \u0627\u0644\u0639\u0631\u0648\u0636.\n\n` +
      `\u0634\u0643\u0631\u0627\u064B \u0644\u062B\u0642\u062A\u0643 \u0628\u0646\u0627 \u{1F64F}\nskmeilb.com` +
      sep +
      `Hello ${firstName}! \u{1F389}\n\n` +
      `Your order has been delivered successfully!\n` +
      `We hope you love your new purchase \u{231A}\n\n` +
      `\u{1F4AC} Your feedback matters \u2014 share your experience!\n` +
      `\u{1F4F2} Save our number to get the latest offers.\n\n` +
      `Thank you for choosing us \u{1F64F}\nskmeilb.com`,

    cancelled:
      `\u0645\u0631\u062D\u0628\u0627\u064B ${firstName}! \u274C\n\n` +
      `\u0646\u0623\u0633\u0641 \u0644\u0625\u0628\u0644\u0627\u063A\u0643 \u0623\u0646 \u0637\u0644\u0628\u0643 \u0631\u0642\u0645 ${orderNum} \u062A\u0645 \u0625\u0644\u063A\u0627\u0624\u0647.\n\n` +
      `\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u062A\u064A \u0643\u0627\u0646\u062A \u0641\u064A \u0637\u0644\u0628\u0643:\n\n${itemsAr}\n\n` +
      `\u0625\u0630\u0627 \u0643\u0627\u0646 \u0644\u062F\u064A\u0643 \u0623\u064A \u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0623\u0648 \u062A\u0631\u064A\u062F \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0637\u0644\u0628\u060C \u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627.\n` +
      `\u0646\u0639\u062A\u0630\u0631 \u0639\u0646 \u0623\u064A \u0625\u0632\u0639\u0627\u062C \u{1F64F}\nskmeilb.com` +
      sep +
      `Hello ${firstName}! \u274C\n\n` +
      `We are sorry to inform you that your order ${orderNum} has been cancelled.\n\n` +
      `Items that were in your order:\n\n${itemsEn}\n\n` +
      `If you have any questions or wish to reorder, please contact us.\n` +
      `We apologize for any inconvenience \u{1F64F}\nskmeilb.com`,
  };

  const text = messages[status];
  if (!text) return null;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

/** WhatsApp link with the bilingual "we received your order" message (the green button next to the phone number). */
export function buildReceivedLink(selectedOrder: Order): string {
  const phone = `961${selectedOrder.customer.phone.replace(/^(\+961|00961|961)/, '').replace(/\s/g, '')}`;
  const firstName = selectedOrder.customer.firstName;
  const orderNumber = selectedOrder.orderNumber;
  const msg = `مرحباً ${firstName}! 👋\n\nشكراً لطلبك من SKMEI.LB 🛍️\nرقم طلبك: #${orderNumber}\n\n✅ لقد استلمنا طلبك بنجاح!\nسنتواصل معك قريباً للتأكيد بعد التحقق من توفر المنتج.\n\n━━━━━━━━━━━━━━━\nHello ${firstName}! 👋\n\nThank you for your order from SKMEI.LB 🛍️\nOrder #: ${orderNumber}\n\n✅ We have received your order successfully!\nWe will contact you shortly to confirm once we verify product availability.\n\n— SKMEI.LB ⌚`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}
