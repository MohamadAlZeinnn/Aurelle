import { siteConfig } from "@/data/site-config";

/**
 * Policy pages. These are STARTING TEMPLATES only — every policy must be
 * reviewed (and the bracketed items completed) by the business and a legal
 * adviser before launch. While `isDraft` is true, the page shows a notice.
 */
export interface Policy {
  slug: string;
  title: string;
  description: string;
  isDraft: boolean;
  body: React.ReactNode;
}

const contactEmail = siteConfig.contact.email;

export const policies: Policy[] = [
  {
    slug: "privacy",
    title: "Privacy Policy",
    description: "How AURELLE collects, uses and protects your personal information.",
    isDraft: true,
    body: (
      <>
        <h2>Information we collect</h2>
        <p>When you place an order, we collect the details needed to deliver it: your name, email address, phone number and delivery address, together with any delivery notes you choose to add.</p>
        <p>If you join our mailing list, we store your email address and the date you gave consent. If you contact us, we keep your message so that we can reply.</p>
        <h2>How we use it</h2>
        <ul>
          <li>To process, deliver and support your orders.</li>
          <li>To contact you about your order, including by phone or messaging before delivery.</li>
          <li>To send our newsletter, only if you have opted in. You can unsubscribe at any time.</li>
        </ul>
        <h2>Sharing</h2>
        <p>We share delivery details with our delivery partner(s) only as needed to complete your delivery, and with service providers who host our website and data on our behalf. [List providers.] We do not sell your personal information.</p>
        <h2>Your browser</h2>
        <p>Your shopping bag is stored in your own browser (local storage) so it is still there when you come back. [Describe any analytics or cookies before enabling them.]</p>
        <h2>Retention & your choices</h2>
        <p>[Set retention periods.] You may ask us to access, correct or delete your personal information by writing to <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.</p>
      </>
    ),
  },
  {
    slug: "terms",
    title: "Terms & Conditions",
    description: "The terms that apply when you use the AURELLE website and place an order.",
    isDraft: true,
    body: (
      <>
        <h2>About us</h2>
        <p>This website is operated by [legal entity name], [registered address], Lebanon.</p>
        <h2>Orders</h2>
        <p>Placing an order is an offer to purchase. We will confirm your order by phone, message or email. We may decline or cancel an order — for example if an item is unavailable or a price was displayed in error — in which case you will not be charged.</p>
        <h2>Prices & payment</h2>
        <p>Prices are shown and charged in US Dollars (USD). Any Lebanese Pound (LBP) amount shown is an indication only. Delivery fees are shown at checkout before you place your order. Available payment methods are shown at checkout.</p>
        <h2>Delivery</h2>
        <p>We currently deliver within {siteConfig.market} only. See <a href="/shipping-returns">Shipping &amp; Returns</a>.</p>
        <h2>Product use</h2>
        <p>Please read and follow the instructions and safety information supplied with each product. Our products are self-care products and are not intended to diagnose, treat, cure or prevent any medical condition.</p>
        <h2>Governing law</h2>
        <p>[To be completed with legal advice.]</p>
      </>
    ),
  },
  {
    slug: "refund",
    title: "Refund Policy",
    description: "Returns, exchanges and refunds for AURELLE orders.",
    isDraft: true,
    body: (
      <>
        <p>For hygiene reasons, opened personal-care products generally cannot be returned unless they are faulty. [Confirm this policy.]</p>
        <h2>Damaged or incorrect items</h2>
        <p>If your order arrives damaged or is not what you ordered, please contact us within [X] days of delivery at <a href={`mailto:${contactEmail}`}>{contactEmail}</a> with your order reference and a photo, and we will arrange a replacement or refund.</p>
        <h2>Unopened items</h2>
        <p>{siteConfig.shipping.returnsWindowDays ? `Unopened items in their original packaging may be returned within ${siteConfig.shipping.returnsWindowDays} days of delivery.` : "[Set the return window for unopened items.]"}</p>
        <h2>How refunds are made</h2>
        <p>[Describe how Cash on Delivery orders are refunded, and how card payments are refunded once online payment is available.]</p>
      </>
    ),
  },
];

export function getPolicy(slug: string) {
  return policies.find((p) => p.slug === slug);
}
