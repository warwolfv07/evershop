import validatePayment from '../validatePayment.js';

export default async function failure(request, response) {
  await validatePayment(request, response);
}
