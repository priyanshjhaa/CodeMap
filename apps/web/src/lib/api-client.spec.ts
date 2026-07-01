import { afterEach, describe, expect, it, vi } from "vitest";

async function importClient() {
  vi.resetModules();
  return import("./api-client");
}

describe("api-client", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses mock data when demo mode is enabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "true");
    vi.stubEnv("NEXT_PUBLIC_USE_LIVE_API", "true");

    const client = await importClient();
    const repositories = await client.listRepositories();

    expect(repositories.length).toBeGreaterThan(0);
    expect(repositories[0]).toHaveProperty("id");
  });

  it("preserves structured API error fields in live mode", async () => {
    vi.stubEnv("NEXT_PUBLIC_DEMO_MODE", "false");
    vi.stubEnv("NEXT_PUBLIC_USE_LIVE_API", "true");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({
          statusCode: 503,
          code: "SERVICE_UNAVAILABLE",
          message: "API unavailable",
          requestId: "req_test"
        })
      })
    );

    const client = await importClient();

    await expect(client.listRepositories()).rejects.toMatchObject({
      name: "ApiError",
      status: 503,
      code: "SERVICE_UNAVAILABLE",
      message: "API unavailable",
      requestId: "req_test"
    });
  });
});
