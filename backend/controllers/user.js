const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/User');

// création d'un compte
exports.signup = (req, res, next) => {
    bcrypt.hash(req.body.password, 10) //on crypte le mot de passe
      .then(hash => { // une fois le cryptage réussi on crée un user avec login et mot de passe
        const user = new User({
          email: req.body.email,
          password: hash
        });
        user.save() // on enregistre le nouvel utilisateur
          .then(() => res.status(201).json({ message: 'Utilisateur créé !' }))
          .catch(error => res.status(400).json({ error }));
      })
      .catch(error => res.status(700).json({ error }));
  };

  // identification par login
  exports.login = (req, res, next) => {
    // on recherche l'existence de l'utilisateur avec l'identifiant en bdd
    User.findOne({ email: req.body.email })
        .then(user => {
            if (!user) { // si l'utilisateur n'est pas trouvé en bdd => erreur
                return res.status(401).json({ error: 'Utilisateur non trouvé !' });
            }
            bcrypt.compare(req.body.password, user.password) // on compare le mot de passe renseigné crypté au mdp crypté inscrit en bdd
                .then(valid => {
                    if (!valid) { // si le mot de passe ne correspond pas => erreur
                        return res.status(401).json({ error: 'Mot de passe incorrect !' });
                    } // sinon on renvoie un token valable 24h pour cet utilisateur
                    res.status(200).json({
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            'RANDOM_TOKEN_SECRET',
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
 };