# NEXUS 1re — Automatismes STI2D

Prototype de jeu incrémental pédagogique destiné aux élèves de **première STI2D**. Le jeu génère ses questions à partir de modèles paramétrés : les nombres et les réponses changent à chaque partie.

## Référence pédagogique

Le contenu suit le **programme d'enseignement de mathématiques de la classe de première de la voie technologique**, publié au Bulletin officiel n° 14 du 2 avril 2026 et applicable à la rentrée 2026-2027.

Le prototype travaille notamment :

- évolutions en pourcentage et évolutions successives ;
- calcul algébrique, équations produit nul ;
- fonctions affines et coefficient directeur ;
- suites arithmétiques et géométriques ;
- dérivation de polynômes de degré inférieur ou égal à 3 ;
- statistiques et probabilités conditionnelles ou indépendantes.

La première version ne cherche pas encore à couvrir chaque capacité du programme. Elle valide la boucle de jeu, la génération procédurale et la progression adaptative.

## Lancer le jeu

Ouvrir `index.html` dans un navigateur ou servir le dossier avec un serveur statique. Aucune compilation et aucune dépendance ne sont nécessaires.

## Fonctionnement

- Une réponse correcte rapporte toujours du flux et de la maîtrise.
- Une réponse en moins de 8 secondes déclenche un bonus de production temporaire.
- Les installations produisent ensuite du flux passivement.
- De nouveaux mondes se débloquent après 12 puis 30 réponses correctes.
- Un nouveau cycle conserve la maîtrise mais échange l'économie en cours contre un bonus permanent.
- La progression est enregistrée localement dans le navigateur.
