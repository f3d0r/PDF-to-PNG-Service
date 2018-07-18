const PDFImage = require("pdf-image").PDFImage;
const config = require('./config');
const fs = require('fs');
const uniqueString = require('unique-string');
const miscFunctions = require('./miscFunctions')

module.exports = {
    convertPDF: function (fileName, pageNumber, makeTransparent, resizeWidth, resizeHeight, successCB, errorCB) {
        var convertOptions = {
            "-density": config.API.PNG_DENSITY,
        }
        if (makeTransparent) {
            convertOptions["-transparent"] = "white";
        } else {
            convertOptions["-background"] = "white";
            convertOptions["-alpha"] = "remove";
        }

        if (resizeWidth != null && resizeHeight != null) {
            convertOptions["-resize"] = resizeWidth + "x" + resizeHeight;
        }

        var pdfImage = new PDFImage(config.API.ORIGINAL_PDF_PATH + "/" + fileName + ".pdf", {
            convertOptions: convertOptions
        });

        pdfImage.convertPage(pageNumber - 1).then(function (imagePath) {
            var newFilePath = miscFunctions.removeFilename(imagePath) + uniqueString() + ".png";
            fs.rename(imagePath, newFilePath, function (err) {
                if (err) {
                    return errorCB("The conversion could not take place.");
                }
                successCB(newFilePath)
            });
        }, function (err) {
            errorCB(err.stderr)
        });
    }
}