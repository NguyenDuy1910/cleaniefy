import type { TemplateDefinition } from "@/templates/catalog";
import type { PartnerSiteState } from "@/features/partner/types";
import { TemplateShell } from "@/templates/shell";
import type { SiteRuntimeMode } from "@/features/booking/site-actions";

export function ProTemplate({
  site,
  definition,
  compact,
  interactive,
  mode,
}: {
  site: PartnerSiteState;
  definition: TemplateDefinition;
  compact?: boolean;
  interactive?: boolean;
  mode?: SiteRuntimeMode;
}) {
  return <TemplateShell site={site} definition={definition} compact={compact} interactive={interactive} mode={mode} />;
}
