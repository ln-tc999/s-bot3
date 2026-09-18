import type { Metadata } from "next";
import { CreatePage } from "@/components/pages/create";

export const metadata: Metadata = {
  title: "Create an index",
  description:
    "Publish a crypto index on BOT Chain with its composition readable onchain.",
};

export default function CreateRoute() {
  return <CreatePage />;
}
