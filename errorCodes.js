module.exports = {
  INVALID_PARAMETER: {
    ERROR_CODE: -2,
    HTTP_CODE: 422,
    INFO: 'One of the parameters entered is invalid.'
  },
  MISSING_PARAMETER: {
    ERROR_CODE: -1,
    HTTP_CODE: 422,
    INFO: 'Missing a query parameter'
  }
};
