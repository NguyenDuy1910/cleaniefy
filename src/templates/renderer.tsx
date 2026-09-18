import { getTemplateDefinition } from "@/templates/catalog";
import { CleanTemplate } from "@/templates/clean";
import { ProTemplate } from "@/templates/pro";
import { WarmHomeTemplate } from "@/templates/warm-home";
import type { PublicSite, TemplateKey } from "@/features/partner/types";

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
}: {
  site: PublicSite;
  compact?: boolean;
  interactive?: boolean;
}) {
  const Template = templateFamilies[site.site.template];
  return (
    <Template
      site={site}
      definition={getTemplateDefinition(site.site.template)}
      compact={compact}
      interactive={interactive}
    />
  );
}
