const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const resizeImg = require('../middleware/img-resize');

const bookCtrl = require('../controllers/book');

router.get('/',  bookCtrl.getAllBook);
router.get('/bestrating',  bookCtrl.getBestRatedBooks);
router.get('/:id',  bookCtrl.getOneBook);
router.post('/',auth,multer, resizeImg, bookCtrl.createBook);
router.put('/:id',auth,multer, resizeImg,  bookCtrl.modifyBook);
router.delete('/:id',auth,  bookCtrl.deleteBook);
router.post('/:id/rating',auth,  bookCtrl.rateBook);

module.exports = router;