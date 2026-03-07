/**
 * PayPal Payment Service
 * Handles PayPal integration with local payment server
 */

import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Update this to your computer's local IP address when testing on physical device
// For Android emulator: use 10.0.2.2
// For iOS simulator: use localhost
// For physical device: use your computer's IP (e.g., 192.168.1.100)
const getDevServerUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_PAYMENT_SERVER_URL;
  if (envUrl) {
    return envUrl;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    '';

  const host = hostUri.split(':')[0];

  if (host && host !== 'localhost' && host !== '127.0.0.1') {
    return `http://${host}:3001`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3001';
  }

  return 'http://localhost:3001';
};

const PAYMENT_SERVER_URL = __DEV__
  ? getDevServerUrl()
  : 'https://your-production-payment-server.com';

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

const parseApiError = async (response: Response, fallback: string): Promise<string> => {
  try {
    const errorData = await response.json();
    const message =
      errorData?.details ||
      errorData?.error ||
      fallback;
    return `${message} (HTTP ${response.status})`;
  } catch {
    return `${fallback} (HTTP ${response.status})`;
  }
};

/**
 * Create a PayPal order
 * @param amount - Total amount to charge
 * @param currency - Currency code (default: USD)
 * @param description - Order description
 */
export const createPayPalOrder = async (
  amount: number,
  currency: string = 'USD',
  description: string = 'Grocery Order'
): Promise<PayPalCreateOrderResponse> => {
  try {
    const response = await fetch(`${PAYMENT_SERVER_URL}/api/paypal/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        description,
      }),
    });

    if (!response.ok) {
      const message = await parseApiError(response, 'Failed to create PayPal order');
      throw new Error(message);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    throw error;
  }
};

/**
 * Capture a PayPal payment after user approval
 * @param orderID - PayPal order ID
 */
export const capturePayPalOrder = async (
  orderID: string
): Promise<PayPalCaptureResponse> => {
  try {
    const response = await fetch(`${PAYMENT_SERVER_URL}/api/paypal/capture-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderID,
      }),
    });

    if (!response.ok) {
      const message = await parseApiError(response, 'Failed to capture PayPal payment');
      throw new Error(message);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    throw error;
  }
};

/**
 * Get PayPal order details
 * @param orderID - PayPal order ID
 */
export const getPayPalOrderDetails = async (orderID: string): Promise<any> => {
  try {
    const response = await fetch(`${PAYMENT_SERVER_URL}/api/paypal/order/${orderID}`);

    if (!response.ok) {
      const message = await parseApiError(response, 'Failed to get order details');
      throw new Error(message);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting PayPal order details:', error);
    throw error;
  }
};

/**
 * Check if payment server is running
 */
export const checkPaymentServerHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${PAYMENT_SERVER_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Payment server is not reachable:', error);
    return false;
  }
};

/**
 * Get approval URL from PayPal order response
 * @param links - Links array from PayPal create order response
 */
export const getApprovalUrl = (links: Array<{ href: string; rel: string }>): string | null => {
  const approveLink = links.find(link => link.rel === 'approve');
  return approveLink ? approveLink.href : null;
};
