import bodyParser from 'body-parser';

export default (request, response, next) => {
  console.log("Inside body parser")
  bodyParser.json({ inflate: false })(request, response, next);
};
