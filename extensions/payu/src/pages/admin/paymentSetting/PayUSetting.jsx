import { Card } from '@components/admin/cms/Card';
import { Field } from '@components/common/form/Field';
import { Toggle } from '@components/common/form/fields/Toggle';
import PropTypes from 'prop-types';
import React from 'react';

export default function PayUPayment({
  setting: {
    payuPaymentStatus,
    payuDisplayName,
    payuMerchantKey,
    payuSalt,
    payuAuthHeader,
    payuMode
  }
}) {
  
  return (
    <Card title="PayU Payment">
      {/* Enable Toggle */}
      <Card.Session>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-1 items-center flex">
            <h4>Enable?</h4>
          </div>
          <div className="col-span-2">
            <Toggle name="payuPaymentStatus" value={payuPaymentStatus || false} />
          </div>
        </div>
      </Card.Session>

      {/* Display Name */}
      <Card.Session>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-1 items-center flex">
            <h4>Display Name</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="payuDisplayName"
              placeholder="Display Name"
              value={payuDisplayName}
            />
          </div>
        </div>
      </Card.Session>

      {/* Merchant Key */}
      <Card.Session>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-1 items-center flex">
            <h4>Merchant Key</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="payuMerchantKey"
              placeholder="Merchant Key"
              value={payuMerchantKey}
            />
          </div>
        </div>
      </Card.Session>

      {/* Salt */}
      <Card.Session>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-1 items-center flex">
            <h4>Salt</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="payuSalt"
              placeholder="Salt"
              value={payuSalt}
            />
          </div>
        </div>
      </Card.Session>

      {/* Auth Header */}
      <Card.Session>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-1 items-center flex">
            <h4>Auth Header</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="text"
              name="payuAuthHeader"
              placeholder="Auth Header"
              value={payuAuthHeader}
              instruction="Used for PayU API authentication"
            />
          </div>
        </div>
      </Card.Session>

      {/* Payment Mode */}
      <Card.Session>
        <div className="grid grid-cols-3 gap-8">
          <div className="col-span-1 items-center flex">
            <h4>Payment Mode</h4>
          </div>
          <div className="col-span-2">
            <Field
              type="radio"
              name="payuMode"
              placeholder="Payment Mode"
              value={payuMode}
              options={[
                { text: 'Test (Sandbox)', value: 'test' },
                { text: 'Production', value: 'production' }
              ]}
            />
          </div>
        </div>
      </Card.Session>
    </Card>
  );
}

PayUPayment.propTypes = {
  setting: PropTypes.shape({
    payuPaymentStatus: PropTypes.number,
    payuDisplayName: PropTypes.string,
    payuMerchantKey: PropTypes.string,
    payuSalt: PropTypes.string,
    payuAuthHeader: PropTypes.string,
    payuMode: PropTypes.string
  }).isRequired
};

export const layout = {
  areaId: 'paymentSetting',
  sortOrder: 9
};

export const query = `
  query Query {
    setting {
      payuPaymentStatus
      payuDisplayName
      payuMerchantKey
      payuSalt
      payuAuthHeader
      payuMode
    }
  }
`;