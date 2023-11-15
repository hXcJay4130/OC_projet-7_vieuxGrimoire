const Book = require('../models/Book');
const fs = require('fs');

exports.createBook = (req, res, next) => {
  // on récupère les informations du livre dans le formulaire (corps de la requête)
  const bookObject = JSON.parse(req.body.book);
  // on efface l'id de l'objet et celui de l'utilisateur créateur
  delete bookObject._id;
  delete bookObject._userId;
  // on crée un livre selon le modèle en récupérant l'objet livre précédent et en y ajoutant l'identifiant de l'utilisateur authentifié et le chemin de l'image
  const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: req.file.path
  });
  // on enregistre en base de données avec un then / catch pour connaitre le statut du résultat de la requête
  book.save()
  .then(() => { res.status(201).json({message: 'Livre enregistré !'})})
  .catch(error => { res.status(400).json( { error })})
};

exports.getOneBook = (req, res, next) => {
  // on recherche le livre en bdd à partir de son identifiant
  Book.findOne({_id: req.params.id})
  .then( //en cas de succès on renvoie le livre
    (book) => {res.status(200).json(book);}
  )
  .catch( // en cas d'erreur on renvoie un mesage d'erreur
    (error) => {res.status(404).json({error: error});}
  );
};

exports.modifyBook = (req, res, next) => {
  // si le fichier image est modifié on crée un objet livre à partir du formulaire et de l'url d'image sinon on a juste besoin de la chaine de caractère req.body
  const bookObject = req.file ? {
    ...JSON.parse(req.body.book),
    imageUrl: req.file.path
  } : { ...req.body };
  // on efface l'id de l'utilisateur créateur
  delete bookObject._userId;
  // on recherche le livre en bdd à partir de son identifiant
  Book.findOne({_id: req.params.id})
  .then((book) => {
      if (book.userId != req.auth.userId) { // seul le créateur du livre peut le modifier
          res.status(403).json({ message : 'unauthorized request'});
      } else {
        if (req.file) {
          const filename = book.imageUrl.split('/images/')[1];
          fs.unlink(`images/${filename}`, () => {
        });
        }
        Book.updateOne({ _id: req.params.id}, { ...bookObject, _id: req.params.id})
            .then(() => res.status(200).json({message : 'Livre modifié!'}))
            .catch(error => res.status(401).json({ error }));
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