import Link from "next/link";
import type { Product } from "@/types/product";
import { siteConfig } from "@/data/site-config";
import { Accordion } from "@/components/ui/Accordion";
import { Pending } from "@/components/ui/primitives";

const PENDING_SPEC = "To be confirmed from the manufacturer's specifications.";

function List({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5">
      {items.map((i) => (
        <li key={i}>{i}</li>
      ))}
    </ul>
  );
}

export function ProductAccordion({ product }: { product: Product }) {
  const s = product.specifications;
  const { deliveryEstimate, returnsWindowDays } = siteConfig.shipping;

  return (
    <Accordion
      variant="compact"
      defaultOpen={["description"]}
      items={[
        {
          id: "description",
          title: "Product Description",
          content: (
            <div className="space-y-4">
              {product.story.map((p, i) => (
                <p key={i} className={i === 0 ? "font-serif text-xl text-ink italic" : ""}>
                  {p}
                </p>
              ))}
              {s.contents && <p>Contents: {s.contents}</p>}
            </div>
          ),
        },
        {
          id: "features",
          title: "Key Features",
          content: s.keyFeatures ? <List items={s.keyFeatures} /> : <Pending>{PENDING_SPEC}</Pending>,
        },
        {
          id: "how-to-use",
          title: "How to Use",
          content: s.howToUse ? (
            <ol className="list-decimal space-y-2 pl-5">
              {s.howToUse.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          ) : (
            <Pending>Full instructions will be published from the manufacturer&apos;s guidance. Always follow the instructions on the packaging.</Pending>
          ),
        },
        {
          id: "ingredients",
          title: "Ingredients and Materials",
          content: s.ingredientsAndMaterials ? <p>{s.ingredientsAndMaterials}</p> : <Pending>{PENDING_SPEC}</Pending>,
        },
        {
          id: "safety",
          title: "Safety Information",
          content: s.safetyInformation ? (
            <List items={s.safetyInformation} />
          ) : (
            <Pending>Safety guidance will be published from the manufacturer&apos;s specifications. Please read the packaging before use.</Pending>
          ),
        },
        {
          id: "shipping",
          title: "Shipping and Returns",
          content: (
            <div className="space-y-3">
              <p>
                We deliver across {siteConfig.market}.{" "}
                {deliveryEstimate ?? "Estimated delivery times will be confirmed shortly."}
              </p>
              <p>
                {returnsWindowDays
                  ? `Unopened items may be returned within ${returnsWindowDays} days of delivery.`
                  : "Our full returns policy will be published before launch."}{" "}
                <Link href="/shipping-returns" className="text-ink underline underline-offset-4">
                  Shipping &amp; Returns
                </Link>
              </p>
            </div>
          ),
        },
      ]}
    />
  );
}
