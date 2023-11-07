const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

const bookCtrl = require('../controllers/book');

router.get('/',  bookCtrl.getAllBook);
router.post('/',auth,multer,  bookCtrl.createBook);
router.get('/:id',  bookCtrl.getOneBook);
router.put('/:id',auth,  bookCtrl.modifyBook);
router.delete('/:id',auth,  bookCtrl.deleteBook);


module.exports = router;