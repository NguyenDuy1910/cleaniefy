import { describe, expect, it } from "vitest";
import { verifyPassword } from "./service";

describe("password compatibility", () => {
  it("verifies the legacy Python scrypt hash format", () => {
    const pythonHash = "scrypt$ABEiM0RVZneImaq7zN3u_w$mtWLRwvkLaYL3k5C6gjsv0TbQUx0Aaemj7TiRUM8FhH3ra7peI2QEAxCsgvn-9wUzm5n0rjX_B3YwT8RhYPB9g";
    expect(verifyPassword("cleanie-demo", pythonHash)).toBe(true);
    expect(verifyPassword("wrong-password", pythonHash)).toBe(false);
  });
});
