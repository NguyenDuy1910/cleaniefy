import { getTemplateDefinition } from "@/templates/catalog";
import { CleanTemplate } from "@/templates/clean";
import { ProTemplate } from "@/templates/pro";
import { WarmHomeTemplate } from "@/templates/warm-home";
import type { PartnerSiteState, TemplateKey } from "@/features/partner/types";
import type { SiteRuntimeMode } from "@/features/booking/site-actions";

const templateFamilies: Record<TemplateKey, typeof CleanTemplate> = {
  clean: CleanTemplate,
  "warm-home": WarmHomeTemplate,
  pro: ProTemplate,
  "fresh-start": CleanTemplate,
  signature: WarmHomeTemplate,
  "eco-calm": CleanTemplate,
  "move-ready": ProTemplate,
  "bright-home": CleanTemplate,
  "studio-luxe": WarmHomeTemplate,
  neighborly: WarmHomeTemplate,
};

export function SiteRenderer({
  site,
  compact = false,
  interactive = true,
  mode = "published",
  resetKey = 0,
}: {
  site: PartnerSiteState;
  compact?: boolean;
  interactive?: boolean;
  mode?: SiteRuntimeMode;
  resetKey?: number;
}) {
  const Template = templateFamilies[site.site.template];
  return (
    <Template
      key={resetKey}
      site={site}
      definition={getTemplateDefinition(site.site.template)}
      compact={compact}
      interactive={interactive}
      mode={mode}
    />
  );
}
