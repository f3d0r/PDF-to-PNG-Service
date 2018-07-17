module.exports = Object.freeze({
    MISSING_PARAMETER: {
        HTTP_CODE: 422,
        ERROR_CODE: -1,
        INFO: "Missing a query parameter"
    },
    INVALID_PARAMETER: {
        HTTP_CODE: 422,
        ERROR_CODE: -2,
        INFO: "One of the parameters entered is invalid."
    }
});