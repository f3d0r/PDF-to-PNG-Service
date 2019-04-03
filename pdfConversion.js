const config = require('./config');
const fs = require('fs');
const miscFunctions = require('./miscFunctions');
const uniqueString = require('unique-string');
const { PDFImage } = require('pdf-image');

module.exports = {
  convertPDF(fileName, pageNumber, makeTransparent, resizeWidth, resizeHeight, successCB, errorCB) {
    const convertOptions = {
      '-density': config.API.PNG_DENSITY
    };
    if (makeTransparent) {
      convertOptions['-transparent'] = 'white';
    } else {
      convertOptions['-background'] = 'white';
      convertOptions['-alpha'] = 'remove';
    }

    if (resizeWidth != null && resizeHeight != null) {
      convertOptions['-resize'] = `${resizeWidth}x${resizeHeight}`;
    }

    const pdfImage = new PDFImage(`${config.API.ORIGINAL_PDF_PATH}/${fileName}.pdf`, {
      convertOptions
    });

    pdfImage.convertPage(pageNumber - 1).then(
      imagePath => {
        const newFilePath = `${miscFunctions.removeFilename(imagePath) + uniqueString()}.png`;
        fs.rename(imagePath, newFilePath, err => {
          if (err) {
            errorCB('The conversion could not take place.');
          } else {
            successCB(newFilePath);
          }
        });
      },
      err => {
        errorCB(err.stderr);
      }
    );
  }
};
