import {
  useCheckout,
  useCheckoutDispatch
} from '@components/common/context/checkout';
import RenderIfTrue from '@components/common/RenderIfTrue';
import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { _ } from '../../../../../../packages/evershop/src/lib/locale/translate/_.js';

export function PayU({ createOrderAPI, orderId, orderPlaced }) {
  const [error, setError] = useState('');
  const [orderCreated, setOrderCreated] = useState(false);

  useEffect(() => {
    if (orderPlaced && orderId && !orderCreated) {
      setOrderCreated(true); // prevent re-run

      const createOrder = async () => {
      const response = await fetch(createOrderAPI, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          order_id: orderId
        })
      });
      const data = await response.json();

      if (!response.error) {
        const { redirectUrl, payuPayload} = data.data;

        // Build a hidden form dynamically in the browser
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = redirectUrl;

        // Add all PayU parameters as hidden inputs
        for (const [key, value] of Object.entries(payuPayload)) {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = value;
          form.appendChild(input);
        }

        // Append to the DOM and auto-submit
        document.body.appendChild(form);
        form.submit();
        
      } else {
        setError(response.error.message);
      }
    };

      createOrder();
    }
  }, [orderPlaced, orderId, orderCreated]);


  return (
    <div>
      {error && <div className="text-critical mb-4">{error}</div>}
      <div className="p-8 text-center border rounded mt-4 border-divider">
        {_('You will be redirected to PayU')}
      </div>
    </div>
  );
}

PayU.propTypes = {
  createOrderAPI: PropTypes.string.isRequired,
  orderId: PropTypes.string,
  orderPlaced: PropTypes.bool.isRequired
};

PayU.defaultProps = {
  orderId: undefined
};

export default function PayUMethod({ createOrderAPI }) {
  const [placed, setPlaced] = useState(false);
  const checkout = useCheckout();
  const { placeOrder } = useCheckoutDispatch();
  const { steps, paymentMethods, setPaymentMethods, orderPlaced, orderId } =
    checkout;

  const selectedPaymentMethod = paymentMethods
    ? paymentMethods.find((pm) => pm.selected)
    : undefined;

  useEffect(() => {
    const selectedPaymentMethod = paymentMethods.find((pm) => pm.selected);
    if (
      !placed &&
      steps.every((step) => step.isCompleted) &&
      selectedPaymentMethod.code === 'payu'
    ) {
      setPlaced(true);
      placeOrder();
    }
  }, [steps]);

  return (
    <div>
      <div className="flex justify-start items-center gap-4">
        <RenderIfTrue
          condition={
            !selectedPaymentMethod || selectedPaymentMethod.code !== 'payu'
          }
        >
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setPaymentMethods((previous) =>
                previous.map((pm) => {
                  if (pm.code === 'payu') {
                    return { ...pm, selected: true };
                  } else {
                    return { ...pm, selected: false };
                  }
                })
              );
            }}
          >
            {/* Empty radio circle when not selected */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
            </svg>
          </a>
        </RenderIfTrue>
        <RenderIfTrue
          condition={!!selectedPaymentMethod && selectedPaymentMethod.code === 'payu'}
        >
          {/* Filled checkmark when selected */}
          <div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2c6ecb"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
        </RenderIfTrue>
        <div>
          {/* You can replace this with PayU logo if available */}
          <span className="font-bold">PayU</span>
        </div>
      </div>

      <div>
        <RenderIfTrue
          condition={!!selectedPaymentMethod && selectedPaymentMethod.code === 'payu'}
        >
          <div>
            <PayU
              createOrderAPI={createOrderAPI}
              orderPlaced={orderPlaced}
              orderId={orderId}
            />
          </div>
        </RenderIfTrue>
      </div>
    </div>
  );
}

PayUMethod.propTypes = {
  createOrderAPI: PropTypes.string.isRequired
};

export const layout = {
  areaId: 'checkoutPaymentMethodpayu',
  sortOrder: 11
};

export const query = `
  query Query {
    createOrderAPI: url(routeId: "payuCreateOrder")
  }
`;
