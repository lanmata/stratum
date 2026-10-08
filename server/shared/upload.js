'use strict';

const multer = require('multer');

const MAX_FILE_BYTES = 10 * 1024 * 1024;

const storage = multer.memoryStorage();

/**
 * Express middleware that parses a multipart upload held in memory and turns multer failures
 * (size limit, unexpected field) into clean 4xx responses instead of unhandled errors.
 * @param {import('multer').Multer} uploader
 * @param {(m: import('multer').Multer) => import('express').RequestHandler} pick
 */
function handleUpload(pick, uploader = multer({ storage, limits: { fileSize: MAX_FILE_BYTES } })) {
  const middleware = pick(uploader);
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (!err) return next();
      const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      res.status(status).json({ error: err.message });
    });
  };
}

module.exports = { handleUpload, MAX_FILE_BYTES };
