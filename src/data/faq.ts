import { siteConfig } from "@/data/site-config";
import { products, FEATURED_PRODUCT_ID } from "@/data/products";

export interface FaqItem {
  id: string;
  question: string;
  /** `null` = waiting on confirmed information; rendered as pending. */
  answer: string | null;
}

const spec = products.find((p) => p.id === FEATURED_PRODUCT_ID)!.specifications;

/**
 * Answers that describe the product come from its `specifications`
 * (manufacturer data) so the FAQ and product page never disagree.
 * Edit `generalAnswers` for copy that isn't a product specification.
 */
const generalAnswers = {
  whatIs:
    "The AURELLE Steam Eye Mask is a self-care essential designed to bring a moment of gentle warmth around the eye area — a simple pause you can make part of your day or evening routine.",
  // Use the manufacturer's own description of how the mask warms.
  howItWorks: null as string | null,
};

function paymentAnswer(): string {
  return siteConfig.payments.cashOnDelivery
    ? "We accept Cash on Delivery, in USD. You pay our courier when your order arrives."
    : "Payment options are confirmed with you on WhatsApp when you order.";
}

const orderAnswer = `Tap "Order on WhatsApp" on the product page, or message us at ${siteConfig.ordering.whatsappDisplay}. Your order details are filled in for you — just add your name and delivery address, and our team will confirm everything with you before delivery.`;

export function getFaqs(): FaqItem[] {
  return [
    { id: "what-is", question: "What is a Steam Eye Mask?", answer: generalAnswers.whatIs },
    { id: "how-it-works", question: "How does the Steam Eye Mask work?", answer: generalAnswers.howItWorks },
    { id: "wear-time", question: "How long should I wear it?", answer: spec.wearDuration },
    { id: "reusable", question: "Is the mask reusable?", answer: spec.reusability },
    { id: "daily", question: "Can I use it every day?", answer: spec.dailyUse },
    { id: "sensitive", question: "Is it suitable for sensitive skin?", answer: spec.sensitiveSkin },
    { id: "order", question: "How do I place an order?", answer: orderAnswer },
    {
      id: "delivery",
      question: "How long does delivery take in Lebanon?",
      answer: siteConfig.shipping.deliveryEstimate,
    },
    { id: "payment", question: "What payment methods are accepted?", answer: paymentAnswer() },
  ];
}

export const PENDING_ANSWER =
  "We are confirming this detail against the manufacturer's specifications and will share it here shortly. In the meantime, our team is happy to help — just get in touch.";
