module.exports = {
    getFileName: function (originalPath) {
        return originalPath.substring(0, originalPath.lastIndexOf('.'))
    },
    convertToCleanPath: function (originalPath) {
        return originalPath.substring(originalPath.indexOf('.'), originalPath.length);
    },
    removeFilename: function(originalPath) {
        return originalPath.substring(0, originalPath.lastIndexOf('/') + 1);
    }
}