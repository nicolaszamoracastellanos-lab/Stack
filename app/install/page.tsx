import type { Metadata } from "next";
import { InstallGuide } from "@/components/InstallGuide";

// Public, shareable guide that walks anyone through adding Stack to their
// iPhone Home Screen (PWA install). Linked from the profile screen, but
// reachable logged-out so the link can be sent to new users.
export const metadata: Metadata = {
  title: "Install Stack — Add to your Home Screen",
};

export default function InstallPage() {
  return <InstallGuide />;
}
