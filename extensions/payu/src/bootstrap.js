import config from 'config';
import { getConfig } from '../../../packages/evershop/dist/lib/util/getConfig.js';
import { hookAfter } from '../../../packages/evershop/dist/lib/util/hookable.js';
import { registerPaymentMethod } from '../../../packages/evershop/dist/modules/checkout/services/getAvailablePaymentMethos.js';
import { getSetting } from '../../../packages/evershop/dist/modules/setting/services/setting.js';

export default async () => {
  // Example: add some PayU-specific defaults (can be removed later)
  const payuPaymentStatus = {
    order: {
      paymentStatus: {
        initiated: {
          name: 'Initiated',
          badge: 'attention',
          progress: 'incomplete'
        },
        failed: {
          name: 'Failed',
          badge: 'critical',
          progress: 'failed'
        }
      }
    }
  };
  config.util.setModuleDefaults('oms', payuPaymentStatus);

  // // Example hook (optional — can be removed for now)
  // hookAfter('changePaymentStatus', async (order, orderID, status) => {
  //   if (order.payment_method !== 'payu') {
  //     return;
  //   }
  //   if (status === 'canceled') {
  //     // In future: call PayU cancel API here
  //     console.log(`PayU payment canceled for order ${orderID}`);
  //   }
  // });

  // Register PayU as a payment method
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
