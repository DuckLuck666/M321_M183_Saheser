const fs = require('fs');
const path = require('path');
const glob = require('glob');
const logger = require('../util/log');
const crypto = require('crypto');

const { isEmpty } = require('../util/helper');
const Mountain = require('../models/mountain');
const loggingEvents = require('../util/loggingEvents'); //logging it
const {
  HTTP_STATUS_OK,
  HTTP_STATUS_CREATED,
  HTTP_STATUS_NOT_FOUND,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  STATIC_DIR,
  USE_SESSIOIN_HANDLING,
  HTTP_STATUS_UNPROCESSABLE_CONTENT,
} = require('../util/const');
const { Op } = require('sequelize');

function toGeoFeatureObj(resultSet) {
  let mnt = {};
  if (!isEmpty(resultSet)) {
    mnt = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [resultSet.longitude, resultSet.latitude],
      },
      id: resultSet.id,
      name: resultSet.name,
      description: resultSet.description,
      elevation: resultSet.elevation,
      img: isEmpty(resultSet.image)
        ? undefined
        : `${process.env.NODE_HOST}/${resultSet.image}`,
      mountainrailway: resultSet.hasmountainrailway,
    };
  }
  return mnt;
}
exports.calculateStatistics = async (req, res, next) => {
  try {
    const elevationLevel = parseInt(req.params.elevationLevel, 10);

    // 1. Find the highest mountain
    const highestMountain = await Mountain.findOne({
      order: [['elevation', 'DESC']],
    });

    // 2. Count mountains above the specified elevation level
    console.log('elevationLevel:', elevationLevel); // Log the elevationLevel
    const countAboveThreshold = await Mountain.count({
      where: {
        userId: { [Op.is]: null },
        elevation: { [Op.gt]: elevationLevel },
      },
    });

    // 3. Find the mountain closest to the North Pole
    const closestToNorthPole = await Mountain.findOne({
      order: [['latitude', 'DESC']], // Closer to 90
    });

    // Prepare the statistics response
    const statistics = {
      highestMountain: {
        name: highestMountain.name,
        elevation: highestMountain.elevation,
      },
      countAboveThreshold,
      closestToNorthPole: {
        name: closestToNorthPole.name,
        latitude: closestToNorthPole.latitude,
      },
    };
    // Read private key and certificate
    const privateKeyPath = path.join(
      process.cwd(),
      '..',
      'zertifikat',
      'server-saheser.key'
    );
    const certPath = path.join(
      process.cwd(),
      '..',
      'zertifikat',
      'server-saheser.crt'
    );
    const privateKey = fs.readFileSync(privateKeyPath, 'utf8');
    const cert = fs.readFileSync(certPath, 'utf8');

    // Extract public key from certificate
    const publicKey = crypto
      .createPublicKey(cert)
      .export({ type: 'spki', format: 'pem' });

    // Convert statistics to JSON string
    const statisticsString = JSON.stringify(statistics);

    // Sign the statistics string using SHA256 and private key
    const sign = crypto.createSign('SHA256');
    sign.update(statisticsString);
    sign.end();
    const signature = sign.sign(privateKey, 'base64');

    // Log signature and public key
    console.log('Signature (Base64):', signature);
    console.log('Public Key (PEM):', publicKey);

    // Send statistics, public key, and signature to frontend
    res.status(200).json({ statistics, publicKey, signature });
  } catch (error) {
    console.error('Error calculating statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
function removeImage(mntId) {
  const staticDir = path.join(process.cwd(), STATIC_DIR);
  const sanitizedMntId = String(mntId).replace(/[^a-zA-Z0-9-]/g, '');
  const pattern = path.join(staticDir, `${sanitizedMntId}.*`);
  glob(pattern, { nodir: true }, (err, images) => {
    if (err) {
      throw err;
    }
    for (const image of images) {
      if (image.startsWith(staticDir)) {
        fs.unlinkSync(image);
      }
    }
  });
}

function logSessionAndCookie(req, res, pageName) {
  try {
    if (!req.sessionID) {
      logger.warn(`Session object not available for request to ${pageName}`);
      return;
    }
    if (!req.session.visitedPages) {
      req.session.visitedPages = [];
    }
    req.session.visitedPages.push(pageName);
    logger.info(
      `Session ${
        req.sessionID
      } visited page: ${pageName}. All visited pages: ${req.session.visitedPages.join(
        ', '
      )}`
    );
    logger.info('cookie request: ' + JSON.stringify(req.cookies));
  } catch (error) {
    logger.error(`Error logging session data: ${error.message}`);
  }
}

exports.getAllPublicMountainIds = async (req, res, next) => {
  try {
    if (USE_SESSIOIN_HANDLING) {
      logSessionAndCookie(req, res, 'overview');
    }
    const resultSet = await Mountain.findAll({
      attributes: ['id'],
      where: { userId: { [Op.is]: null } },
    });
    const mntIds = resultSet.map((item) => item.id);
    res.status(HTTP_STATUS_OK).json(mntIds);
  } catch (err) {
    err.statusCode = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    next(err);
  }
};

exports.getPublicMountain = async (req, res, next) => {
  try {
    let httpStatus = HTTP_STATUS_NOT_FOUND;
    const mnt = await Mountain.findOne({
      where: {
        userId: { [Op.is]: null },
        id: req.params.id,
      },
    });
    if (!isEmpty(mnt)) {
      httpStatus = HTTP_STATUS_OK;
    }
    res.status(httpStatus).json(toGeoFeatureObj(mnt));
  } catch (err) {
    err.statusCode = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    next(err);
  }
};
const { validationResult } = require('express-validator');
exports.addPublicMountain = async (req, res, next) => {
  try {
    console.log('addPublicMountain request:', req.body);

    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('addPublicMountain validation error: ', errors);
      return res
        .status(HTTP_STATUS_UNPROCESSABLE_CONTENT)
        .json({ errors: errors.array() });
    }

    const { name, elevation, longitude, latitude, hasmountainrailway, description } =
      req.body;

    // Check if all required fields are present
    if (!name || !elevation || !longitude || !latitude) {
      return res.status(HTTP_STATUS_BAD_REQUEST).json({
        message: 'Name, elevation, longitude, and latitude are required!',
      });
    }

    const mountain = await Mountain.create({
      name,
      elevation,
      longitude,
      latitude,
      hasmountainrailway,
      description,
    });

    console.log('addPublicMountain success, ID:', mountain.id);

    loggingEvents.addMountainLog(mountain);

    res.status(HTTP_STATUS_CREATED).json(toGeoFeatureObj(mountain));
  } catch (err) {
    console.error('addPublicMountain error:', err.message);
    next({
      statusCode: HTTP_STATUS_INTERNAL_SERVER_ERROR,
      message: err.message,
    });
  }
};
exports.updatePublicMountain = async (req, res, next) => {
  try {
    let httpStatus = HTTP_STATUS_NOT_FOUND;
    let mnt = await Mountain.findOne({
      where: {
        userId: { [Op.is]: null },
        id: req.params.id,
      },
    });
    loggingEvents.editMountainLog(mnt);

    if (!isEmpty(mnt)) {
      mnt.name = req.body.name || mnt.name;
      mnt.elevation = req.body.elevation || mnt.elevation;
      mnt.longitude = req.body.longitude || mnt.longitude;
      mnt.latitude = req.body.latitude || mnt.latitude;
      mnt.hasmountainrailway = req.body.hasmountainrailway; // Direct assignment
      mnt.description = req.body.description || mnt.description;

      await mnt.save();
      httpStatus = HTTP_STATUS_OK;
    }
    res.status(httpStatus).json(toGeoFeatureObj(mnt));
  } catch (err) {
    err.statusCode = HTTP_STATUS_INTERNAL_SERVER_ERROR;
    next(err);
  }
};

exports.addPublicMountainImage = async (req, res, next) => {
  try {
    console.log('start addPublicMountainImage', req.params);
    const mountainId = String(req.params.mntid).replace(/[^a-zA-Z0-9-]/g, '');
    console.log(mountainId);

    if (!req.file || !req.file.filename || !mountainId) {
      const error = new Error('No image file provided');
      error.statusCode = HTTP_STATUS_BAD_REQUEST;
      throw error;
    }

    const fileExtension = path.extname(req.file.filename).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    if (!allowedExtensions.includes(fileExtension)) {
      const error = new Error('Invalid file type');
      error.statusCode = HTTP_STATUS_BAD_REQUEST;
      throw error;
    }

    let httpStatus = HTTP_STATUS_NOT_FOUND;
    let mnt = await Mountain.findOne({
      where: {
        id: mountainId,
      },
      where: {
        userId: { [Op.is]: null },
        id: mountainId,
      },
    });

    if (!isEmpty(mnt)) {
      const sanitizedFilename = path.basename(req.file.filename);
      mnt.image = sanitizedFilename;
      await mnt.save();
      httpStatus = HTTP_STATUS_OK;
    } else {
      removeImage(mountainId);
    }

    res.status(httpStatus).json(toGeoFeatureObj(mnt));
  } catch (err) {
    console.log('addPublicMountainImage error: ', err);
    err.statusCode = err.statusCode || HTTP_STATUS_INTERNAL_SERVER_ERROR;
    removeImage(mountainId);
    next(err);
  }
};
exports.deletePublicMountain = async (req, res, next) => {
  try {
    let httpStatus = HTTP_STATUS_NOT_FOUND;
    let countDeletedMnt = 0;
    const mntId = req.params.id;
    if (!isEmpty(mntId)) {
      countDeletedMnt = await Mountain.destroy({
        where: {
          userId: { [Op.is]: null },
          id: mntId,
        },
      });

      if (countDeletedMnt != 0) {
        loggingEvents.deleteMountainLog(countDeletedMnt);
        httpStatus = HTTP_STATUS_OK;
        removeImage(mntId);
      }
    }
    res.status(httpStatus).json({ mountainsDeleted: countDeletedMnt });
  } catch (err) {
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};
