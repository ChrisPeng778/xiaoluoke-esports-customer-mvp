import { SettingsModule, type SettingsSectionKey } from "@/components/admin/SettingsModule";

const allowed = new Set([
  "basic",
  "tip",
  "customer-service",
  "sms",
  "notification",
  "agreement",
  "worker",
  "payment",
  "order",
  "business-target",
  "finance",
  "resources",
]);

export default async function AdminSettingsSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const sectionKey = allowed.has(section) ? (section as SettingsSectionKey) : "basic";
  return <SettingsModule sectionKey={sectionKey} />;
}
