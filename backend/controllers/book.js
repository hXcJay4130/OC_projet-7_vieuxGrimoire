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

exports.rateBook = (req, res) => {
  //on récupère le livre à l'id correspondant
  Book.findOne({ _id: req.params.id })
      .then(book => {
          //on vérifie si l'utilisateur a déjà noté le livre => pas possible de remettre une note
          if (book.ratings.includes(rating => rating.userId == req.auth.userId)) {
              res.status(404).json({ message: 'Vous avez déja noté ce livre' });
          // on vérifie que la note soit comprise entre 1 et 5
          } else if (1 > req.body.rating > 5) {
              res.status(404).json({ message: 'La note doit être comprise entre 1 et 5' });
          } else {
              //push le userId et le grade dans le tableau ratings de l'objet book
              book.ratings.push({
                  userId: req.auth.userId,
                  grade: req.body.rating
              });
              //on initialise la somme de toutes les notes du tableau ratings
              let sumGrades = 0
              //pour chaque index du tableau ratings, on récupère la 'grade' et on l'ajoute à la somme des notes
              for (let i = 0; i < book.ratings.length; i++) {
                  sumGrades += book.ratings[i].grade;
              }
              //on actualise la note moyenne en divisant la somme des notes par le nombre de notes dispo dans le tableau
              book.averageRating = Math.round((sumGrades / book.ratings.length) * 100) / 100;
              return book.save();
          }
      })
      .then((book) => { res.status(200).json(book); })
      .catch((error) => { res.status(404).json({ error: error }); });
};


exports.getBestRatedBooks = (req, res, next) => {
  Book.find().sort({averageRating:-1}).limit(3)
  .then((books) => {res.status(200).json(books);})
  .catch((error) => {res.status(400).json({error: error});});
};