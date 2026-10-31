import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPolicy, policies } from "@/data/policies";
import { PageHeader } from "@/components/ui/PageHeader";
import { DraftNotice } from "@/components/ui/DraftNotice";

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const policy = getPolicy((await params).slug);
  return policy
    ? { title: policy.title, description: policy.description, alternates: { canonical: `/policies/${policy.slug}` } }
    : {};
}

export default async function PolicyPage({ params }: { params: Promise<{ slug: string }> }) {
  const policy = getPolicy((await params).slug);
  if (!policy) notFound();
  return (
    <>
      <PageHeader eyebrow="Policies" title={policy.title} />
      <section className="py-16 md:py-24">
        <div className="container-site max-w-3xl">
          {policy.isDraft && <DraftNotice />}
          <div className="prose-aurelle">{policy.body}</div>
        </div>
      </section>
    </>
  );
}
