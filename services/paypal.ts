/**
 * PayPal Payment Service
 * Calls the secured Rails API on Heroku.
 * - All requests require a valid JWT (Authorization header)
 * - The amount is resolved server-side from the Order record — never trusted from the client
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from './api';

const PAYMENT_SERVER_URL = `${API_BASE_URL}/api/v1`;

// ── Types ────────────────────────────────────────────────────────────────────

export interface PayPalCreateOrderResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface PayPalCaptureResponse {
  id: string;
  status: string;
  payer: any;
  purchase_units: any[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Reads the JWT token from AsyncStorage (same key used by useAuth) */
const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const token = await AsyncStorage.getItem('token');
  if (!token) throw new Error('Not authenticated. Please log in to continue.');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

const parseApiError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const errorData = await response.json();
    return errorData?.error || errorData?.details || `${fallback} (HTTP ${response.status})`;
  } catch {
    return `${fallback} (HTTP ${response.status})`;
  }
};

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Create a PayPal order.
 * @param orderId - The internal DB Order ID.
 *                  The server looks up the real amount — the client does NOT send the price.
 */
export const createPayPalOrder = async (
  orderId: number
): Promise<PayPalCreateOrderResponse> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${PAYMENT_SERVER_URL}/paypal/create-order`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ order_id: orderId }),
  });

  if (!response.ok) {
    const message = await parseApiError(response, 'Failed to create PayPal order');
    throw new Error(message);
  }

  return response.json();
};

/**
 * Capture a PayPal payment after the user approves it in the browser.
 * @param paypalOrderId - The PayPal order ID returned by createPayPalOrder
 * @param orderId       - The internal DB Order ID (used server-side to verify ownership)
 */
export const capturePayPalOrder = async (
  paypalOrderId: string,
  orderId: number
): Promise<PayPalCaptureResponse> => {
  const headers = await getAuthHeaders();

  const response = await fetch(`${PAYMENT_SERVER_URL}/paypal/capture-order`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ orderID: paypalOrderId, order_id: orderId }),
  });

  if (!response.ok) {
    const message = await parseApiError(response, 'Failed to capture PayPal payment');
    throw new Error(message);
  }

  return response.json();
};

/**
 * Extract the approval URL from PayPal order links
 */
export const getApprovalUrl = (links: Array<{ href: string; rel: string }>): string | null => {
  const approveLink = links.find(link => link.rel === 'approve');
  return approveLink ? approveLink.href : null;
};
