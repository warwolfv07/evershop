import { select, update } from '@evershop/postgres-query-builder';
import crypto from 'crypto';
import { error } from '../../../../../packages/evershop/dist/lib/log/logger.js';
import { pool } from '../../../../../packages/evershop/dist/lib/postgres/connection.js';
import { buildUrl } from '../../../../../packages/evershop/dist/lib/router/buildUrl.js';
import { getConfig } from '../../../../../packages/evershop/dist/lib/util/getConfig.js';
import {
  INTERNAL_SERVER_ERROR,
  INVALID_PAYLOAD,
  OK
} from '../../../../../packages/evershop/dist/lib/util/httpStatus.js';
import { getValueSync } from '../../../../../packages/evershop/dist/lib/util/registry.js';
import { toPrice } from '../../../../../packages/evershop/dist/modules/checkout/services/toPrice.js';
import { getContextValue } from '../../../../../packages/evershop/dist/modules/graphql/services/contextHelper.js';
import { getSetting } from '../../../../../packages/evershop/dist/modules/setting/services/setting.js';
//import { createAxiosInstance } from '../../services/requester.js';

export default async (request, response, next) => {
  try {
    console.log("Inside createOrder")
    const { order_id } = request.body;
    const order = await select()
      .from('order')
      .where('uuid', '=', order_id)
      .and('payment_method', '=', 'payu')
      .and('payment_status', '=', 'pending')
      .load(pool);

    if (!order) {
      return response.status(INVALID_PAYLOAD).json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'Invalid order'
        }
      });
    } else {
      // Build the order for createOrder API PayPal
      const items = await select()
        .from('order_item')
        .where('order_item_order_id', '=', order.order_id)
        .execute(pool);
      const catalogPriceInclTax = getConfig(
        'pricing.tax.price_including_tax',
        false
      );
      const price = {
        currency_code: order.currency,
        value: toPrice(order.grand_total),
        breakdown: {
          item_total: {
            currency_code: order.currency,
            value: catalogPriceInclTax
              ? toPrice(order.sub_total_incl_tax)
              : toPrice(order.sub_total)
          },
          shipping: {
            currency_code: order.currency,
            value: catalogPriceInclTax
              ? toPrice(order.shipping_fee_incl_tax)
              : toPrice(order.shipping_fee_excl_tax)
          },
          discount: {
            currency_code: order.currency,
            value: toPrice(order.discount_amount)
          }
        }
      };
      if (!catalogPriceInclTax) {
        price.breakdown.tax_total = {
          currency_code: order.currency,
          value: toPrice(order.total_tax_amount)
        };
      }

      const finalAmount = getValueSync('payuFinalAmount', price, {
        order,
        items
      });


      const orderData = {
        //intent: await getSetting('paypalPaymentIntent', 'CAPTURE'),
        purchase_units: [
          {
            items: items.map((item) => ({
              name: item.product_name,
              sku: item.product_sku,
              quantity: item.qty,
              unit_amount: {
                currency_code: order.currency,
                value: catalogPriceInclTax
                  ? toPrice(item.final_price_incl_tax)
                  : toPrice(item.final_price)
              }
            })),
            amount: finalAmount
          }
        ],
      //   application_context: {
      //     cancel_url: `${getContextValue(request, 'homeUrl')}${buildUrl(
      //       'paypalCancel',
      //       { order_id }
      //     )}`,
      //     return_url: `${getContextValue(request, 'homeUrl')}${buildUrl(
      //       'paypalReturn',
      //       { order_id }
      //     )}`,
      //     shipping_preference: 'SET_PROVIDED_ADDRESS',
      //     user_action: 'PAY_NOW',
      //     brand_name: await getSetting('storeName', 'Evershop')
      //   }
      };
      const shippingAddress = await select()
        .from('order_address')
        .where('order_address_id', '=', order.shipping_address_id)
        .load(pool);
      
      
      // Add shipping address
      if (shippingAddress) {
        const address = {
          address_line_1: shippingAddress.address_1,
          address_line_2: shippingAddress.address_2,
          admin_area_2: shippingAddress.city,
          postal_code: shippingAddress.postcode,
          country_code: shippingAddress.country
        };
        if (shippingAddress.province) {
          address.admin_area_1 = shippingAddress.province.split('-').pop();
        }
        orderData.purchase_units[0].shipping = {
          address
        };
      } else {
        // This is digital order, no shipping address
        orderData.purchase_units[0].shipping = {
          address: {
            address_line_1: 'No shipping address',
            address_line_2: 'No shipping address',
            admin_area_1: 'No shipping address',
            admin_area_2: 'No shipping address',
            postal_code: 'No shipping address',
            country_code: 'No shipping address'
          }
        };
      }

      const billingAddress = await select()
        .from('order_address')
        .where('order_address_id', '=', order.billing_address_id)
        .load(pool);

      // Add billing address
      if (billingAddress) {
        const address = {
          address_line_1: billingAddress.address,
          address_line_2: billingAddress.address2,
          admin_area_2: billingAddress.city,
          postal_code: billingAddress.postcode,
          country_code: billingAddress.country
        };
        if (billingAddress.province) {
          address.admin_area_1 = billingAddress.province.split('-').pop();
        }
        orderData.purchase_units[0].billing = {
          address
        };
      }

      const txnid = `PAYU_${Date.now()}_${order_id}`;

      const key = process.env.PAYU_MERCHANT_KEY;
      const salt = process.env.PAYU_MERCHANT_SALT;
      //const amount = finalAmount.value.toString();
      const amount = "620.00";
      const productinfo = 'Evershop Order';
      const fullname = order.customer_full_name || 'Customer';
      const email = order.customer_email || 'test@example.com';
      const phone = shippingAddress.telephone || '9999999999';
      const surl = `${process.env.BASE_URL}/payu/success`;
      const furl = `${process.env.BASE_URL}/payu/failure`;

      //Generate hash (sequence: key|txnid|amount|productinfo|firstname|email|||||||||||salt)
      const hashString = `${key}|${txnid}|${amount}|${productinfo}|${fullname}|${email}|||||||||||${salt}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');
      
      const payuPayload = {
      key,
      txnid,
      amount,
      productinfo,
      fullname,
      email,
      phone,
      surl,
      furl,
      hash
    };

    console.log(payuPayload);
    console.log(finalAmount.value);


      // const finalPaypalOrderData = getValueSync(
      //   'finalPaypalOrderData',
      //   orderData,
      //   {
      //     order,
      //     items,
      //     shippingAddress,
      //     billingAddress
      //   }
      // );
      // Call PayPal API to create order using axios
      // const axiosInstance = await createAxiosInstance(request);
      // const { data } = await axiosInstance.post(
      //   `/v2/checkout/orders`,
      //   finalPaypalOrderData,
      //   {
      //     validateStatus: (status) => status < 500
      //   }
      // );
 
        // Update order and insert transaction id
        await update('order')
          .given({ integration_order_id: txnid })
          .where('uuid', '=', order_id)
          .execute(pool);

        response.status(OK);
        return response.json({
          data: {
            payuPayload,
            redirectUrl:
              process.env.PAYU_ENVIRONMENT === 'LIVE'
                ? 'https://secure.payu.in/_payment'
                : 'https://test.payu.in/_payment'
          }
        });
      
    }
  } catch (err) {
    error(err);
    return next(err);
  }
};
