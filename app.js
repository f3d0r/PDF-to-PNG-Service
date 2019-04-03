const express = require('express');
require('express-async-errors');

const app = express();

const config = require('./config');
const errors = require('./errorHandler');
const fs = require('fs');
const miscFunctions = require('./miscFunctions');
const multer = require('multer');
const pdf = require('pdf-parse');
const pdfConverter = require('./pdfConversion');
const uniqueString = require('unique-string');

app.use(express.json());

const storage = multer.diskStorage({
  // multers disk storage settings
  destination(req, file, cb) {
    cb(null, config.API.ORIGINAL_PDF_PATH);
  },
  filename(req, file, cb) {
    cb(null, `${uniqueString()}.pdf`);
  }
});

const upload = multer({
  // multer settings
  fileFilter(req, file, callback) {
    if (!file.mimetype.endsWith('pdf')) {
      return callback(new Error('Only PDFs are allowed.'));
    }
    return callback(null, true);
  },
  storage
}).single('pdf');

app.get('/ping', async (req, res) => {
  res.send('pong');
});

app.get('/', (req, res) => {
  res.send('Welcome to the PDF to PNG Conversion service.');
});

app.post('/convert_pdf', async (req, res) => {
  const pdfPath = await new Promise((resolve, reject) => {
    upload((uploadReq, uploadRes, err) => {
      if (err) return reject(err);
      return uploadReq.file.path;
    });
  });
  const dataBuffer = fs.readFileSync(pdfPath);
  const pdfInfo = await pdf(dataBuffer);
  let htmlReturn = '<p>';
  for (let currentPage = 1; currentPage <= pdfInfo.numpages; currentPage += 1) {
    htmlReturn +=
      `<a href="${config.API.BASE_URL}:${config.API.PORT}/get_image` +
      `?document_id=${miscFunctions.getFileName(
        req.file.filename
      )}&page_number=${currentPage}">Page #${currentPage}</a><br>`;
  }
  htmlReturn += '</p>';
  res.send(htmlReturn);
});

app.get('/get_image', async (req, res) => {
  if (!errors.queryExists(req, 'document_id')) {
    return errors.sendErrorJSON(res, 'MISSING_PARAMETER', 'document_id query parameter required.');
  }
  if (!errors.queryExists(req, 'page_number')) {
    return errors.sendErrorJSON(res, 'MISSING_PARAMETER', 'page_number query parameter required.');
  }
  let makeTransparent = false;
  if (errors.queryExists(req, 'transparent')) {
    makeTransparent = true;
  }

  let resizeWidth = null;
  let resizeHeight = null;

  if (errors.queryExists(req, 'resize_width') !== errors.queryExists(req, 'resize_height')) {
    return errors.sendErrorJSON(
      res,
      'MISSING_PARAMETER',
      'both resize_width and resize_height query parameter required.'
    );
  }
  if (errors.queryExists(req, 'resize_width') === errors.queryExists(req, 'resize_height')) {
    if (req.query.resize_width <= 0 || req.query.resize_height <= 0) {
      return errors.sendErrorJSON(
        res,
        'INVALID_PARAMETER',
        'both resize_width and resize_height query parameter must be greater than 0.'
      );
    }
    resizeWidth = req.query.resize_width;
    resizeHeight = req.query.resize_height;

    const convertedImagePath = await new Promise(resolve =>
      pdfConverter.convertPDF(
        req.query.document_id,
        req.query.page_number,
        makeTransparent,
        resizeWidth,
        resizeHeight,
        imagePath => {
          resolve(imagePath);
        }
      )
    );
    await new Promise((resolve, reject) => {
      res.download(`${__dirname}/${convertedImagePath}`, err => {
        if (err) return reject(err);
        return resolve();
      });
    });
    await new Promise((resolve, reject) => {
      fs.unlink(convertedImagePath, err => {
        if (err) reject(err);
        else resolve(convertedImagePath);
      });
    });
  }
});

app.listen(config.API.PORT, () => {
  console.log(`Server has started on port ${config.API.PORT}!`);
});
