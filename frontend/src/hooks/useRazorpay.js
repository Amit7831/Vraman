/**
 * src/hooks/useRazorpay.js
 * Dynamically loads Razorpay checkout.js and exposes a pay() function.
 * Designed for TEST MODE — works with rzp_test_* keys.
 */
import { useCallback } from 'react';
import api from '../services/api';

const RAZORPAY_SCRIPT_SRC = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (document.getElementById('rzp-checkout-script')) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.id = 'rzp-checkout-script';
    script.src = RAZORPAY_SCRIPT_SRC;
    script.onload  = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * useRazorpay()
 * Usage:
 *   const { pay } = useRazorpay();
 *   pay({ bookingId, onSuccess, onFailure });
 */
export function useRazorpay() {
  const pay = useCallback(async ({ bookingId, onSuccess, onFailure }) => {
    // 1. Load Razorpay SDK
    const loaded = await loadRazorpayScript();
    if (!loaded) {
      onFailure?.('Failed to load Razorpay SDK. Check your internet connection.');
      return;
    }

    try {
      // 2. Create order on our backend
      const { data: orderData } = await api.post('/payment/create-order', { bookingId });

      // 3. Open Razorpay checkout popup
      const options = {
        key:         orderData.keyId,
        amount:      orderData.amount,       // in paise
        currency:    orderData.currency,
        name:        'Vraman Travel',
        description: `Booking #${bookingId.slice(-8).toUpperCase()}`,
        order_id:    orderData.orderId,
        prefill:     orderData.prefill || {},
        theme:       { color: '#FF6B35' },
        modal:       { ondismiss: () => onFailure?.('Payment cancelled.') },

        handler: async (response) => {
          try {
            // 4. Verify signature on backend
            const { data } = await api.post('/payment/verify', {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
              bookingId,
            });
            onSuccess?.(data);
          } catch (err) {
            onFailure?.(err.response?.data?.message || 'Payment verification failed.');
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        onFailure?.(resp.error?.description || 'Payment failed.');
      });
      rzp.open();

    } catch (err) {
      onFailure?.(err.response?.data?.message || 'Could not initiate payment. Please try again.');
    }
  }, []);

  return { pay };
}
