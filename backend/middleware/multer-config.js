const multer = require('multer');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
//   destination: (req, file.path, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    // const name = file.originalname.split(' ').join('_');
    const name = file.originalname.split('.')[0].split(' ').join('_');
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
    // path.join('images',`resized-${filename}.webp`)
  }
});


module.exports = multer({storage: storage}).single('image');