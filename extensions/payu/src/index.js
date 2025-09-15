// extensions/payu/index.js
module.exports = {
  name: 'payu',
  bootstrap: require.resolve('./src/bootstrap.js'),  // <-- NEW
  extendApi: [],
  extendAdmin: [
    require.resolve('./pages/admin/paymentSetting/PayUSetting.jsx')
  ],
  extendStorefront: []
};

console.log(">>> PayU extension loaded");
