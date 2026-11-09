# BTP Life — Analyse révisée et recommandations

30 octobre 2026 — code examiné : `15b153f`. Dossier propre au début de l'analyse. L'accueil public et la démonstration ont été réouverts dans le navigateur intégré. Aucun code applicatif ni déploiement modifié.

**Appréciation maintenue : 6,5/10 pour l'expérience actuelle.** Cette note est une appréciation éditoriale, pas un résultat de benchmark. Le projet possède une base pédagogique et technique substantielle ; les prochains gains viennent de la cohérence de l'expérience et de la finition. Aucun nouveau commit applicatif n'a été constaté depuis la précédente analyse.

Périmètre : lecture ciblée du code, inspection de l'accueil et de la démonstration sur l'affichage étroit disponible, et observations de personnalisation faites lors de l'analyse précédente dans cette conversation. Pas de parcours connecté complet, de benchmark sur téléphone physique, ni de validation du multijoueur réel. La correspondance exacte entre le commit local et le déploiement public n'a pas été recontrôlée dans cette analyse.

## Ce que la précédente recommandation doit corriger

- Les textures réagissant à la lumière, les ombres, les reflets d'environnement et les effets de rendu existent déjà. Il faut les régler et mieux différencier les matières.
- Les façades, balcons, horaires de PNJ, variations de foule et véhicules existent. Le prochain travail porte sur leur variété et la continuité des comportements.
- Une convention d'échelle existe. Vérifier les raccords et proportions reste utile, mais aucune mesure n'établit ici un défaut généralisé d'échelle.
- Les cours, leur suivi connecté et les certificats de modules existent. Ce qui manque est une progression distincte pour le BTS et le parcours ingénieur.
- La journée de chantier sans chantier personnel est explicitement traitée comme apprentissage non rémunéré en partie connectée. C'est une divergence de conception avec la démo, pas la preuve d'une panne de paiement.

## Constats et décisions recommandées

| Priorité | Constat vérifié | Conséquence | Décision proposée |
|---|---|---|---|
| P1 | L'accueil promet 25 000 F ; le serveur attribue 15 000, 25 000, 40 000 ou 60 000 F selon le profil. | Attente incorrecte au moment de commencer. | Annoncer une prime selon le profil et montrer montant et logement avant validation. |
| P1 | Sans chantier personnel, le bilan paie la démo mais n'accorde ni ce salaire ni cette XP en partie connectée. | Le débutant peut suivre l'activité suggérée sans obtenir les gains aperçus dans la démo. | Ajouter un travail d'initiation rémunéré et validé côté serveur, accessible sans posséder un chantier. Aligner les règles de démo. |
| P1 | Les besoins suivent le temps du monde ; les séances paient au plus toutes les 20 minutes réelles par lieu. | La vitesse accélère certaines dépenses sans raccourcir ce délai. | Simuler une journée par profil à ×1/×2/×3 ; équilibrer besoins, revenus et protection contre la répétition abusive ensemble. |
| P1 | L'affichage étroit consacre beaucoup de surface au HUD ; le guide a des positions fixes et peut recouvrir les interactions, déjà observé au passage précédent. | Lecture et visibilité du personnage réduites. | Un panneau principal à la fois ; guide compact ou intégré à l'objectif lorsqu'une interaction s'ouvre. |
| P2 | `formationDepart` conserve le choix BTS/ingénieur, sans piloter deux cursus fonctionnels distincts. | Le choix ne transforme pas suffisamment la carrière étudiante. | Brancher les cours existants sur des étapes, prérequis, examens, stages et débouchés différenciés. |
| P2 | Les bâtiments utilisent une trame répétitive ; les blocs opaques de `BlocsInstances` partagent une finition d'enduit. | Le métal, le béton et les encadrements se distinguent trop souvent seulement par leur couleur. | Introduire des familles de matières et 3–4 familles de façades, en conservant le regroupement des objets pour les performances. |
| P2 | L'avatar sur mesure utilise un modèle stylisé ; les personnages prédéfinis utilisent des modèles articulés plus réalistes. | Rupture visible entre les personnages dans le même univers. | Si la cible reste le réalisme, créer un corps articulé personnalisable avec vêtements et coiffures compatibles. Ce travail demande aussi des ressources 3D, pas seulement des réglages d'éclairage. |
| P2 | Les horaires et trajets des PNJ existent, mais reposent largement sur des boucles de points et une présence par créneau. | Animation urbaine sans continuité complète d'une journée individuelle. | Développer trois PNJ utiles : arrivée, travail, pause, interaction et départ. |

Ne pas conclure que toute l'économie est déficitaire : autres lieux, missions, défis et campagne offrent également des revenus. Les équilibres doivent être mesurés sur des parcours représentatifs.

## Carte : atteindre un réalisme cohérent

Conserver la carte et l'interface actuelles, puis améliorer un trajet pilote logement → rue → université ou chantier. Son changement visuel doit être évident aux mêmes positions de caméra.

1. **Matières :** distinguer enduit, béton brut, métal, verre et bois ; contrôler la taille des textures et leur répétition. Ne pas ajouter indistinctement davantage d'effets.
2. **Architecture :** varier les volumes, retraits, entrées, vitrines et toitures ; donner une fonction identifiable aux bâtiments proches du parcours. Les balcons existants doivent varier plutôt qu'être ajoutés partout.
3. **Raccords :** soigner pieds de façades, accès, bordures, drainage, végétation et jonctions de chaussée. Utiliser des références visuelles locales pour construire une identité cohérente.
4. **Caméra :** comparer la vue d'ensemble existante avec une caméra plus proche. Une caméra basse existe déjà ; vérifier sa lisibilité et les occultations avant d'en faire un mode privilégié.
5. **Lumière et pluie :** régler les systèmes existants au soleil, la nuit et sous la pluie. La pluie influence déjà le ciel et certains comportements ; l'humidité des sols mérite une liaison explicite aux matériaux, avec des variations localisées.
6. **Personnages :** harmoniser le corps personnalisable, les personnages réalistes et leurs silhouettes distantes. Une ville plus détaillée rendrait autrement leur divergence plus visible.

## Ordre de réalisation et critères de sortie

| Lot | Travail | Vérification avant de poursuivre |
|---|---|---|
| A — Début de partie | Prime annoncée correctement, activité débutant rémunérée, HUD lisible. | Un joueur neuf comprend son logement, sa tâche et son gain ; le versement persiste après reconnexion et ne peut pas être doublé. |
| B — Rue pilote | Matières, façades, raccords, caméra, lumière et famille visuelle des personnages. | Comparaison avant/après aux mêmes positions et conditions, puis captures soleil/pluie/nuit. Aucune régression de lisibilité ou de déplacement. |
| C — Première semaine | Différenciation des cinq profils, premier cursus étudiant, objectifs et budget. | Parcours complets avec étapes accessibles et budget explicable à chaque vitesse ; distinguer ce qui est acquis une fois de ce qui reste rejouable. |
| D — Vie de quartier | Trois PNJ suivis dans leur journée, interactions contextuelles, progression visible du chantier. | Le joueur comprend pourquoi revenir à un lieu ; les comportements restent cohérents lorsqu'il entre et sort. |
| E — Extension | Étendre les règles et ressources validées aux autres quartiers. | Mesurer chargement, FPS, mémoire et stabilité sur les appareils cibles avec le même trajet avant/après. |

Objectifs d'essai proposés, non résultats acquis : une première activité compréhensible sans explication extérieure, une récompense durable, aucun bouton essentiel masqué, et un niveau de fluidité défini sur les téléphones effectivement visés. Choisir ces appareils avant de fixer un budget graphique. Les optimisations adaptatives et les niveaux de détail déjà présents sont à préserver.

Un 10/10 ne peut pas être garanti par une liste de fonctionnalités. Il faut des sessions avec des joueurs nouveaux et habitués pour vérifier compréhension, plaisir, difficulté, raisons de revenir et stabilité. Ne pas agrandir la carte ni réécrire le moteur avant d'avoir validé ce parcours pilote.

## Vérifications exécutées

Cinq suites ciblées ont été relancées : profils de départ, objectif principal, architecture de la ville, vie urbaine et personnages du joueur. **36 tests sur 36 passent.** Le premier essai avait échoué avant l'exécution des tests sur un renommage de fichier temporaire interdit par le sandbox Windows ; la relance hors sandbox a réussi. Aucun échec applicatif n'est déduit de cette première erreur.

Ces tests valident des règles et structures locales. Ils ne prouvent ni la qualité visuelle, ni la fluidité mobile, ni un parcours connecté complet. La suite globale, la compilation et les migrations n'ont pas été relancées pour cette revue ciblée.

## Repères dans le code

- Prime publique : `frontend/src/app/(public)/page.tsx:29`, `:107` ; règle serveur : `backend/src/carriere/carriere.service.ts:22`.
- Bilan de chantier : `frontend/src/components/app/quartier-3d.tsx:758` ; information d'apprentissage : `panneau-journee-chantier.tsx:110`.
- Besoins : `backend/src/carriere/besoins.service.ts:22`, `:144` ; délai de séance : `backend/src/carriere/lieux.service.ts:35`, `:105` ; horloge : `frontend/src/lib/sauvegarde-monde.ts:52`.
- Choix de formation : `frontend/src/components/app/creation-vie.tsx:134`, `:195` ; cours et certificats : `lieu-universite.tsx:31`, `:43`.
- Architecture : `frontend/src/lib/architecture-ville.ts:36` ; finition commune : `frontend/src/components/app/blocs-instances.tsx:29`, `materiaux-monde.tsx:76`.
- Rendu : `materiaux-monde.tsx:60`, `reflets-monde.tsx:6`, `eclairage-monde.tsx:10`, `rendu-avance.tsx:66`.
- Avatars : `frontend/src/components/app/humain-monde.tsx:25`, `:44` ; catalogue : `frontend/src/lib/personnages-joueur.ts:132`.
- Vie urbaine : `frontend/src/lib/vie-urbaine.ts:9` ; déplacements : `frontend/src/components/app/scene-quartier.tsx:180` ; circulation : `rue-abidjan.tsx:65`.
- Guide : `frontend/src/components/app/quartier-3d.tsx:1064` ; performances : `fluidite-monde.tsx:34`.

Les chemins abrégés dans une même puce restent relatifs au dossier indiqué dans cette puce. Ces repères décrivent le code examiné, pas une preuve de bon fonctionnement de chaque parcours en production.
