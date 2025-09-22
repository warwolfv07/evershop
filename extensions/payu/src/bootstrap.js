import config from 'config';
import { getConfig } from '../../../packages/evershop/dist/lib/util/getConfig.js';
import { hookAfter } from '../../../packages/evershop/dist/lib/util/hookable.js';
import { registerPaymentMethod } from '../../../packages/evershop/dist/modules/checkout/services/getAvailablePaymentMethos.js';
import { getSetting } from '../../../packages/evershop/dist/modules/setting/services/setting.js';
//for later implementation for cancellation of transaction
// import { cancelPayUTransaction } from './services/cancelPayUTransaction.js';

export default async () => {
  // 1. Define payment statuses for PayU
  const payuPaymentStatus = {
    order: {
      paymentStatus: {
        failed: {
          name: 'Failed',
          badge: 'critical',
          progress: 'failed'
        },
        refunded: {
          name: 'Refunded',
          badge: 'critical',
          progress: 'complete'
        },
        partial_refunded: {
          name: 'Partial Refunded',
          badge: 'critical',
          progress: 'incomplete'
        }
      },
      psoMapping: {
        'failed:*': 'new',
        'refunded:*': 'closed',
        'partial_refunded:*': 'processing',
        'partial_refunded:delivered': 'completed'
      }
    }
  };
  config.util.setModuleDefaults('oms', payuPaymentStatus);

  // 2. Hook after payment status change (optional for PayU)
  // For now, no cancel API like Stripe. You can enable later if PayU supports it.
  /*
  hookAfter('changePaymentStatus', async (order, orderID, status) => {
    if (status !== 'canceled') return;
    if (order.payment_method !== 'payu') return;
    await cancelPayUTransaction(orderID);
  });
  */

  // 3. Register PayU as a payment method
  registerPaymentMethod({
    init: async () => ({
      methodCode: 'payu',
      methodName: await getSetting('payuDisplayName', 'PayU')
    }),
    validator: async () => {
      const payuConfig = getConfig('system.payu', {});
      let payuStatus;
      if (payuConfig.status) {
        payuStatus = payuConfig.status;
      } else {
        payuStatus = await getSetting('payuPaymentStatus', 0);
      }
      return parseInt(payuStatus, 10) === 1;
    }
  });
};
