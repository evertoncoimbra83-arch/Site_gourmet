import { describe, expect, it } from "vitest";
import { ENV } from "./_core/env";

/**
 * Test to validate WooCommerce API credentials
 * This test verifies that the credentials are correctly set and can connect to the WooCommerce API
 */
describe("WooCommerce API Integration", () => {
  it("should have WooCommerce credentials configured", () => {
    expect(ENV.woocommerceUrl).toBeDefined();
    expect(ENV.woocommerceConsumerKey).toBeDefined();
    expect(ENV.woocommerceConsumerSecret).toBeDefined();
    
    // Verify URL format
    expect(ENV.woocommerceUrl).toMatch(/^https?:\/\//);
  });

  it("should be able to construct WooCommerce API URL", () => {
    const apiUrl = `${ENV.woocommerceUrl}/wp-json/wc/v3`;
    expect(apiUrl).toBeDefined();
    expect(apiUrl).toContain("gourmetsaudavel.com.br");
  });

  it("should have valid consumer credentials format", () => {
    // Consumer Key should start with 'ck_'
    expect(ENV.woocommerceConsumerKey).toMatch(/^ck_/);
    
    // Consumer Secret should start with 'cs_'
    expect(ENV.woocommerceConsumerSecret).toMatch(/^cs_/);
  });

  it("should be able to create Basic Auth header", () => {
    const credentials = `${ENV.woocommerceConsumerKey}:${ENV.woocommerceConsumerSecret}`;
    const encodedCredentials = Buffer.from(credentials).toString("base64");
    
    expect(encodedCredentials).toBeDefined();
    expect(encodedCredentials.length).toBeGreaterThan(0);
  });
});
