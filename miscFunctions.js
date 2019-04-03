module.exports.convertToCleanPath = originalPath => {
  return originalPath.substring(originalPath.indexOf('.'), originalPath.length);
};

module.exportsgetFileName = originalPath => {
  return originalPath.substring(0, originalPath.lastIndexOf('.'));
};

module.exports.removeFilename = originalPath => {
  return originalPath.substring(0, originalPath.lastIndexOf('/') + 1);
};
