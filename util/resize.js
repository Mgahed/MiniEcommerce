const sharp = require("sharp");
const paths = require("path");
const resize = async (img, folderName, width, height) => {
  await sharp(img.path)
    .resize(width, height)
    .png({quality: 100})
    .toFile(paths.resolve(img.destination, folderName, img.filename));

}
module.exports.resize = resize;