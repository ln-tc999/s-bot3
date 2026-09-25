import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { IndexDetailPage } from "@/components/pages/index-detail";
import { fetchIndex } from "@/lib/chain/registry";

/** Records change only when someone publishes, so a short window is enough. */
export const revalidate = 30;

interface IndexRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: IndexRouteProps): Promise<Metadata> {
  const { slug } = await params;
  const index = await fetchIndex(slug).catch(() => null);

  if (!index) {
    return { title: "Index not found" };
  }

  return {
    title: index.name,
    description: index.methodology || undefined,
    openGraph: {
      title: index.name,
      description: index.methodology || undefined,
    },
    /** The card is 1200x630, so ask for the wide treatment rather than a thumbnail. */
    twitter: {
      card: "summary_large_image",
      title: index.name,
      description: index.methodology || undefined,
    },
  };
}

export default async function IndexRoute({ params }: IndexRouteProps) {
  const { slug } = await params;
  const index = await fetchIndex(slug).catch(() => null);

  if (!index) {
    notFound();
  }

  return <IndexDetailPage index={index} />;
}
