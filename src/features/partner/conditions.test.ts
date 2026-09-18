import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import { ownedServiceCondition, publishedPartnerCondition } from "./conditions";

const dialect = new PgDialect();

describe("tenant-safe query conditions", () => {
  it("scopes a private service lookup by its owning partner", () => {
    const query = dialect.sqlToQuery(ownedServiceCondition("partner-a", "service-a"));
    expect(query.sql).toContain('"services"."partner_id"');
    expect(query.params).toEqual(["service-a", "partner-a"]);
  });

  it("makes public partner lookups published-only", () => {
    const query = dialect.sqlToQuery(publishedPartnerCondition("jessica"));
    expect(query.sql).toContain('"partners"."status"');
    expect(query.params).toEqual(["jessica", "published"]);
  });
});
