const express = require('express');
const app = express();
const uniqueString = require('unique-string');
const multer = require('multer');
const errors = require('./errorHandler');
const pdfConverter = require('./pdfConversion');
const getPageCount = require('docx-pdf-pagecount');
const miscFunctions = require('./miscFunctions');
const config = require('./config')
const fs = require('fs');
// ------------------------------------------------------------------------------

var storage = multer.diskStorage({ //multers disk storage settings
    destination: function (req, file, cb) {
        cb(null, config.API.ORIGINAL_PDF_PATH);
    },
    filename: function (req, file, cb) {
        cb(null, uniqueString() + ".pdf")
    }
});

var upload = multer({ //multer settings
    storage: storage,
    fileFilter: function (req, file, callback) {
        if (!file.mimetype.endsWith('pdf')) {
            return callback(new Error('Only PDFs are allowed.'))
        }
        callback(null, true)
    }
}).single('pdf');

// SETUP SERVER --------------------------------------------------------------

app.use(express.json());

// SERVER ENDPOINTS ----------------------------------------------------------

app.get('/ping', function (req, res) {
    res.status(200).send('pong');
})

app.get('/', function (req, res) {
    res.status(200).send('Welcome to the PDF to PNG Conversion service.');
});

app.post('/convert_pdf', function (req, res) {
    upload(req, res, function (err) {
        if (err) {
            res.status(415).send("Only PDFs are Allowed.");
        } else {
            getPageCount(req.file.path)
                .then(pages => {
                    var htmlReturn = "<p>"
                    for (var currentPage = 1; currentPage <= pages; currentPage++) {
                        htmlReturn += "<a href=\"" + config.API.BASE_URL + ":" + config.API.PORT + "/get_image" +
                            "?document_id=" + miscFunctions.getFileName(req.file.filename) + "&page_number=" + currentPage + "\">Page #" + currentPage + "</a><br>";
                    }
                    htmlReturn += "</p>";
                    res.status(200).send(htmlReturn);
                })
                .catch((err) => {
                    console.log(err);
                });
        }
    });
});

app.get('/get_image', function (req, res) {
    if (!errors.queryExists(req, 'document_id')) {
        return errors.sendErrorJSON(res, 'MISSING_PARAMETER', "document_id query parameter required.");
    } else if (!errors.queryExists(req, 'page_number')) {
        return errors.sendErrorJSON(res, 'MISSING_PARAMETER', "page_number query parameter required.");
    } else {
        var makeTransparent = false;
        if (errors.queryExists(req, 'transparent')) {
            makeTransparent = true;
        }

        var resizeWidth = null;
        var resizeHeight = null;

        if (errors.queryExists(req, 'resize_width') != errors.queryExists(req, 'resize_height')) {
            return errors.sendErrorJSON(res, 'MISSING_PARAMETER', "both resize_width and resize_height query parameter required.");
        } else if (errors.queryExists(req, 'resize_width') == errors.queryExists(req, 'resize_height')) {
            if (req.query.resize_width <= 0 || req.query.resize_height <= 0) {
                return errors.sendErrorJSON(res, 'INVALID_PARAMETER', "both resize_width and resize_height query parameter must be greater than 0.");
            } else {
                resizeWidth = req.query.resize_width;
                resizeHeight = req.query.resize_height;

                pdfConverter.convertPDF(req.query.document_id, req.query.page_number, makeTransparent, resizeWidth, resizeHeight, function (imagePath) {
                    res.sendFile(__dirname + "/" + imagePath, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            fs.unlink(imagePath, (err) => {
                                if (err) {
                                    console.log("File could not be deleted : " + err);
                                }
                            });
                        }
                    });
                }, function (err) {
                    errors.sendErrorJSON(res, 'INVALID_PARAMETER', "the document_id or page_number you entered is invalid.");
                });
            }
        }
    }
});

// START SERVER ---------------------------------------------------------------
app.listen(config.API.PORT, function () {
    console.log("Server has started on port " + config.API.PORT + "!");
})