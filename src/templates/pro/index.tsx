import type { TemplateDefinition } from "@/templates/catalog";
import type { PublicSite } from "@/features/partner/types";
import { TemplateShell } from "@/templates/shell";

export function ProTemplate({
  site,
  definition,
  compact,
  interactive,
}: {
  site: PublicSite;
  definition: TemplateDefinition;
  compact?: boolean;
  interactive?: boolean;
}) {
  return <TemplateShell site={site} definition={definition} compact={compact} interactive={interactive} />;
}
