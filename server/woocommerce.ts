import { ENV } from "./_core/env";

/**
 * WooCommerce API Helper
 * Handles all communication with the WooCommerce REST API
 */

interface WooCommerceRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: Record<string, unknown>;
}

/**
 * Make a request to the WooCommerce REST API
 * Uses Basic Authentication with Consumer Key and Consumer Secret
 */
export async function woocommerceRequest<T>(
  endpoint: string,
  options: WooCommerceRequestOptions = {}
): Promise<T> {
  const { method = "GET", body } = options;

  if (!ENV.woocommerceUrl || !ENV.woocommerceConsumerKey || !ENV.woocommerceConsumerSecret) {
    throw new Error("WooCommerce credentials not configured");
  }

  // Create Basic Auth header
  const credentials = `${ENV.woocommerceConsumerKey}:${ENV.woocommerceConsumerSecret}`;
  const encodedCredentials = Buffer.from(credentials).toString("base64");

  const url = `${ENV.woocommerceUrl}/wp-json/wc/v3${endpoint}`;

  const requestOptions: RequestInit = {
    method,
    headers: {
      "Authorization": `Basic ${encodedCredentials}`,
      "Content-Type": "application/json",
    },
  };

  if (body) {
    requestOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, requestOptions);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`WooCommerce API error: ${response.status} - ${error}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Get all products from WooCommerce
 */
export async function getProducts(params?: Record<string, unknown>) {
  const searchParams = new URLSearchParams();
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
  }

  const endpoint = `/products${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;
  return woocommerceRequest(endpoint);
}

/**
 * Get a single product by ID
 */
export async function getProduct(productId: number) {
  return woocommerceRequest(`/products/${productId}`);
}

/**
 * Get all product categories
 */
export async function getCategories() {
  return woocommerceRequest("/products/categories");
}

/**
 * Create an order
 */
export async function createOrder(orderData: Record<string, unknown>) {
  return woocommerceRequest("/orders", {
    method: "POST",
    body: orderData,
  });
}

/**
 * Get an order by ID
 */
export async function getOrder(orderId: number) {
  return woocommerceRequest(`/orders/${orderId}`);
}

/**
 * Get all orders for a customer
 */
export async function getCustomerOrders(customerId: number) {
  return woocommerceRequest("/orders", {
    method: "GET",
  });
}
