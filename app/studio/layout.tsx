import StudioTransition from "@/components/admin/StudioTransition";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <StudioTransition>{children}</StudioTransition>;
}
