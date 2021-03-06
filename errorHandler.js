const ERROR_CODES = require('./errorCodes');

module.exports = {
  queryExists(req, queryName) {
    if (
      typeof req.query[queryName] === 'undefined' ||
      req.query[queryName] === null ||
      req.query[queryName] === ''
    ) {
      return false;
    }
    return true;
  },
  sendErrorJSON(res, error, extraJSON) {
    const responseJSON = {
      error: {
        error_code: ERROR_CODES[error].ERROR_CODE,
        error_info: ERROR_CODES[error].INFO
      }
    };
    if (typeof extraJSON !== 'undefined' && extraJSON !== null && error === 'MISSING_PARAMETER') {
      responseJSON.error.missing_parameter = extraJSON;
    } else if (typeof extraJSON !== 'undefined' && extraJSON != null) {
      responseJSON.error.info = extraJSON;
    }
    res.status(ERROR_CODES[error].HTTP_CODE).json(responseJSON);
  }
};
