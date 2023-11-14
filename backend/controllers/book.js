const Book = require('../models/Book');
const fs = require('fs');

exports.createBook = (req, res, next) => {
  
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;
  const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  });

  book.save()
  .then(() => { res.status(201).json({message: 'Livre enregistré !'})})
  .catch(error => { res.status(400).json( { error })})

};

exports.getOneBook = (req, res, next) => {
  Book.findOne({
    _id: req.params.id
  }).then(
    (book) => {
      res.status(200).json(book);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modifyBook = (req, res, next) => {
  const bookObject = req.file ? {
    ...JSON.parse(req.body.book),
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
  } : { ...req.body };

  delete bookObject._userId;

  Book.findOne({_id: req.params.id})
  .then((book) => {
      if (book.userId != req.auth.userId) {
          res.status(403).json({ message : 'unauthorized request '});
      } else {
        const formerFilename = book.imageUrl.split('/images/')[1];
        // console.log(formerFilename)
        // console.log(req.file)
        fs.unlink(`images/${formerFilename}`, () => {
          Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
              .then(() => { res.status(200).json({message: 'Livre modifié !'})})
              .catch(error => res.status(401).json({ error }));
        });
      }
  })     
  .catch((error) => res.status(400).json({ error }));
};

exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id})
      .then(book => {
          if (book.userId != req.auth.userId) {
              res.status(401).json({message: 'Not authorized'});
          } else {
              const filename = book.imageUrl.split('/images/')[1];
              fs.unlink(`images/${filename}`, () => {
                  Book.deleteOne({_id: req.params.id})
                      .then(() => { res.status(200).json({message: 'Livre supprimé !'})})
                      .catch(error => res.status(401).json({ error }));
              });
          }
      })
      .catch( error => {
          res.status(500).json({ error });
      });
};

exports.getAllBook = (req, res, next) => {
  Book.find().then(
    (books) => {
      res.status(200).json(books);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.rateBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id})
  .then(book => {
      if (book.userId == req.auth.userId) {
        res.status(403).json({ message : 'unauthorized request '});
      } else {
        let sum =req.body.rating;
        for (let cpt=0; cpt < book.ratings.length; cpt++) {
          sum += book.ratings[cpt].grade;
        }
        const average = sum / (book.ratings.length+1);
        delete book.userId;
        const bookObject = new Book({
          // _id : req.params.id,
          userId : req.auth.userId,
          title: book.title,
          author: book.author,
          imageUrl: book.imageUrl,
          year: book.year,
          genre: book.genre,
          // ...book,
          ratings: [...book.ratings,{userId : req.auth.userId , grade : req.body.rating}],
          averageRating : average
        });
        console.log(bookObject);
        res.status(200).json(req.params.id);
        Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
        // Book.updateOne({ _id: req.params.id}, { bookObject})
        .then(() => {res.status(200).json(req.params.id)})
        .catch(error => res.status(401).json({ error }));

      }
  })
  .catch( error => {
      res.status(400).json({ error });
      // console.log(error);
  });
};

exports.getBestRatedBooks = (req, res, next) => {
  Book.find().sort({averageRating:-1}).limit(3)
  .then((books) => {res.status(200).json(books);})
  .catch((error) => {res.status(400).json({error: error});});
};