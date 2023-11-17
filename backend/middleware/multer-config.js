const multer = require('multer');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png'
};
// configuration de multer qui permet de traiter les fichiers téléchargés
const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images'); // la destination d'enregistrement est le fichiers /images
  },
  filename: (req, file, callback) => {
    const name = file.originalname.split('.')[0].split(' ').join('_'); // l'image est renommée avec des _ au lieu des espaces pour éviter des problèmes de serveur
    const extension = MIME_TYPES[file.mimetype]; // l'extension est récupérée ....
    callback(null, name + Date.now() + '.' + extension); // ... et rajoutée au nouveau nom de fichier
  }
});

module.exports = multer({storage: storage}).single('image');