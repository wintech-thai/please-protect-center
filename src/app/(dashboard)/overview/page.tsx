import OverviewView from "@/src/modules/dashboard/view/overview.view";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "PLEASE-PROTECT-CENTER",
};

export default function OverviewPage() {
  return <OverviewView />;
}