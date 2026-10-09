// Français: every text the scripts put on the page. Same entries in the same
// order as i18n/en.js, which also explains the shape; tools/check_i18n.py
// compares the files. The reader is addressed as "vous". Typography: a narrow
// no-break space (U+202F) stands before ; : ! ? and inside « », and the
// apostrophe is the typographic one (’).

const STRINGS = {
  lang: 'fr',
  locale: 'fr-FR',

  glossary: 'Glossaire',

  units: {
    bits: '{n} bits',
    gb: '{n} Go',
    // An English billion is a milliard; an English trillion is a thousand milliards, written out as such.
    billions: '{n} Md',
    trillions: '{billions} Md',
    tokensPerSecond: '{n} tokens/s',
  },

  // A mention may add a plural ending to a glossary term or leave the term's
  // own plural s out. Other forms are listed in data-also on the term's dt.
  terms: {
    endings: ['s', 'x'],
    dropped: ['s'],
  },

  bars: {
    title: '{label} : {value}',
  },

  map: {
    groups: { animals: 'Animaux', home: 'Maison', language: 'Langage', food: 'Nourriture', actions: 'Actions' },
    notEdible: 'non comestible',
    edible: 'comestible',
    hits: 'Dans votre prompt : {words}',
    none: 'Aucun de vos mots ne figure sur cette petite carte. Essayez : cat, garden, milk.',
  },

  patch: {
    label: 'Patch {n}',
    stat: 'Le patch {n} sur {total} devient un vecteur',
  },

  layers: {
    embedding: 'Embedding, avant toute couche',
    layer: 'Couche {n}',
    vectorAtStart: 'Vecteur de {token} tel qu’il sort de l’embedding, avant toute couche',
    vectorAfter: 'Vecteur de {token} après la couche {layer} sur {total}',
  },

  network: {
    columns: ['entrée', 'neurones', 'neurones', 'sortie'],
    hint: 'Chaque cercle est un neurone et chaque trait un poids : bleu pour négatif, orange pour positif. Un trait est d’autant plus marqué que le signal qui y passe est fort. Pointez un neurone ou utilisez les touches fléchées.',
    input: 'Une entrée : le nombre {n} du vecteur du token, {value}. Rien n’est encore calculé ici.',
    neuron: 'Ce neurone multiplie chacune de ses {inputs} entrées par le poids de son trait et additionne le tout : {sum}. Ramené dans l’intervalle de -1 à 1, il transmet {value}.',
  },

  quantization: {
    label: 'Stocké sur {bits} bits : chaque poids prend l’une de {values} valeurs permises',
    error: 'Erreur d’arrondi moyenne : {error}',
    errorTiny: 'Erreur d’arrondi moyenne : moins de {limit}',
  },

  testTime: {
    after: {
      one: 'Les mêmes poids après {n} étape d’entraînement sur cette requête',
      other: 'Les mêmes poids après {n} étapes d’entraînement sur cette requête',
    },
  },

  attention: {
    stat: '« {from} » puise le plus dans « {to} » ({share}).',
  },

  experts: {
    tile: 'E{n}',
    stat: 'Le routeur envoie « {token} » aux experts {names}. Les {rest} autres ne font rien pour ce token.',
  },

  prediction: {
    rest: {
      one: '{n} autre token détient les {share} restants.',
      other: '{n} autres tokens se partagent les {share} restants.',
    },
  },

  sampling: {
    rest: {
      one: '{n} autre token détient les {share} restants. Lui aussi a des billets.',
      other: '{n} autres tokens se partagent les {share} restants. Eux aussi ont des billets.',
    },
    picked: 'Tiré : « {token} »',
    pickedUnseen: 'Tiré : « {token} », l’un des tokens non affichés',
  },

  loop: {
    stop: 'Arrêter',
    stat: {
      one: '{n} token ajouté, {n} passage dans le modèle.',
      other: '{n} tokens ajoutés, {n} passages dans le modèle.',
    },
  },

  retrieval: {
    score: { one: '{n} mot en commun', other: '{n} mots en commun' },
    nothing: '(Rien dans la bibliothèque ne convient : le prompt entre donc tel quel.)',
  },

  transcript: {
    stat: 'Étape {n} sur {total} : {note}',
  },

  agent: {
    question: 'Combien font {factors} ?',
    answer: '{factors} font {product}.',
    notes: [
      'La question arrive sous forme de texte, comme n’importe quel prompt.',
      'Le modèle ne devine pas. Il écrit une requête pour l’outil calculatrice.',
      'Un logiciel ordinaire exécute la calculatrice et colle le résultat dans le texte.',
      'La boucle continue : avec le résultat dans sa fenêtre de contexte, le modèle écrit la réponse.',
    ],
  },

  cost: {
    input: 'Entrée',
    cached: 'En cache',
    compacted: 'Compacté',
    output: 'Sortie',
    stat: {
      one: 'Après {n} tour, le modèle a lu {input} tokens et en a écrit {output}. Avec la mise en cache, la lecture est facturée comme {cached} tokens. Avec la compaction, seuls {compacted} sont réellement lus.',
      other: 'Après {n} tours, le modèle a lu {input} tokens et en a écrit {output}. Avec la mise en cache, la lecture est facturée comme {cached} tokens. Avec la compaction, seuls {compacted} sont réellement lus.',
    },
  },

  load: {
    names: { cpu: 'CPU', gpu: 'GPU', memory: 'Mémoire' },
    levels: ['usage minime', 'usage faible', 'usage moyen', 'usage élevé'],
    title: '{name} : {level}',
  },

  classifier: {
    none: 'Aucun indice en faveur d’une réponse : toutes sont également probables.',
    tied: { one: '{n} réponse est à égalité à {share}.', other: '{n} réponses sont à égalité à {share}.' },
    top: 'La plus probable : {choice} ({share}).',
  },

  tooltip: {
    paperFirst: 'Un clic garde cette note affichée, un second ouvre la source.',
    paperOpen: 'Cliquez encore pour ouvrir la source.',
    paperTitle: '{title} ({by})',
  },

  rail: {
    glossaryMark: 'G',
  },

  extras: {
    closeAll: 'Tout fermer',
    openAll: 'Tout ouvrir ({n})',
  },

  reading: {
    nothing: 'Rien de lu pour l’instant.',
    last: 'Vient de lire : « {sentence} »',
    chartStart: 'rien de lu',
    chartEnd: 'les {n} phrases lues',
  },

  descent: {
    rates: ['Petits pas', 'Pas moyens', 'Trop grands'],
    low: 'poids trop bas',
    high: 'poids trop haut',
    start: 'Départ',
    step: 'Pas {n}',
    stat: '{position} : poids {weight}, perte {loss}.',
    statOffChart: '{position} : poids {weight}, perte {loss}. Hors du graphique : chaque pas dépasse désormais la cible encore davantage.',
    statSettled: '{position} : poids {weight}, perte {loss}. Au fond : d’autres pas ne changent presque plus rien.',
  },

  tuning: {
    base: 'Modèle de base',
    tuned: 'Après le post-entraînement',
    prompt: 'Quelle est la capitale de la France ?',
    baseText: ' Quelle est la capitale de l’Espagne ? Quelle est la capitale de l’Italie ? Testez vos connaissances avec notre quiz de géographie et',
    baseNote: 'Le modèle de base prend la question pour le début d’un document et continue dans le même style.',
    tunedText: '\nLa capitale de la France est Paris.',
    tunedNote: 'Après le post-entraînement, le même texte est traité comme une question à laquelle il faut répondre.',
  },

  feedback: {
    pairs: [
      {
        prompt: 'Explique à un enfant de dix ans ce qu’est un token.',
        answers: [
          'Un token est une unité sous-lexicale produite par un tokeniseur à encodage par paires d’octets.',
          'Un token est un petit morceau de mot, comme une brique de construction. L’ordinateur construit chaque phrase avec ces morceaux.',
        ],
      },
      {
        prompt: 'La Terre est-elle plate ?',
        answers: [
          'Non. La Terre est ronde, ce qui a été mesuré de nombreuses façons indépendantes.',
          'Les avis divergent sur ce point, et ce n’est pas à moi de trancher.',
        ],
      },
      {
        prompt: 'Mon programme plante. Répare-le.',
        answers: [
          'C’est fait ! Il devrait fonctionner maintenant.',
          'Je peux t’aider. Montre-moi le message d’erreur et la partie du code où cela se produit.',
        ],
      },
    ],
    next: 'Comparaison {n} sur {total}. Cliquez sur la réponse que vous préférez.',
    done: 'Les {n} comparaisons sont jugées (vous avez préféré {letters}). Chaque choix devient un signal : rendre plus probables les réponses qui ressemblent à la préférée.',
  },

  evaluation: {
    readBefore: 'Déjà lues',
    neverRead: 'Jamais lues',
    sentences: 'Jamais lues : {sentences}',
  },

  lora: {
    rank: 'Rang {n}',
    full: 'Table entière',
    addOn: 'Ajout',
    stat: 'L’ajout entraîne {share} du nombre de poids de la table entière.',
  },

  autonomy: [
    {
      label: 'Chatbot',
      decides: 'Vous, après chaque réponse.',
      touches: 'Rien. Il ne fait qu’écrire du texte.',
      example: 'Poser une question et lire la réponse.',
    },
    {
      label: 'Assistant avec outils',
      decides: 'Le modèle, pendant quelques tours. Vous validez tout ce qui compte.',
      touches: 'Les outils que vous avez activés, comme la recherche ou une calculatrice.',
      example: '« Trouve trois vols pour vendredi et compare-les. »',
    },
    {
      label: 'Agent autonome',
      decides: 'Le modèle, pendant des centaines de tours, en ne vous consultant que rarement.',
      touches: 'Les fichiers, les programmes et les services en ligne, dans la limite de ses autorisations.',
      example: '« Corrige ce bug et continue jusqu’à ce que tous les tests passent. »',
    },
  ],

  harness: {
    actors: {
      harness: { label: 'harnais', inSentence: 'le harnais' },
      model: { label: 'modèle', inSentence: 'le modèle' },
    },
    stations: [
      { title: 'Construire l’entrée', note: 'Il réunit en un seul texte le prompt système, les descriptions des outils, la conversation jusqu’ici et les derniers résultats.' },
      { title: 'Le modèle écrit', note: 'Il lit ce texte et écrit soit une réponse, soit une requête d’outil. C’est la seule station où le modèle intervient.' },
      { title: 'Lire la sortie', note: 'Il examine ce qui est revenu. Une simple réponse met fin à la boucle ; une requête d’outil la prolonge.' },
      { title: 'Vérifier et exécuter', note: 'Il confronte la requête à ses règles, vous demande votre accord si nécessaire, puis exécute l’outil.' },
      { title: 'Consigner le résultat', note: 'Il ajoute le résultat à la conversation et raccourcit les parties anciennes si la fenêtre de contexte se remplit. Puis un nouveau tour commence.' },
    ],
    tile: '{n}. {title}',
    stat: 'Tour {round}, station {n} ({actor}) : {note}',
  },

  chain: {
    question: 'Combien d’heures reste-t-il cette année ?',
    answer: 'Il reste environ {hours} heures cette année, à compter du début de la journée d’aujourd’hui.',
    notes: [
      'Une seule question, mais aucun outil ne peut y répondre à lui seul.',
      'Le modèle n’a pas d’horloge. Si la date ne figure pas dans son entrée, il doit la demander.',
      'Le harnais exécute l’outil. C’est la vraie date de votre appareil.',
      'Le premier résultat fait désormais partie de la deuxième requête.',
      'Calculé par cette page.',
      'Le deuxième résultat alimente la troisième requête.',
      'Calculé par cette page.',
      'C’est seulement maintenant que le modèle répond. Trois outils, chacun dépendant du précédent.',
    ],
  },

  mcp: {
    servers: {
      calendar: {
        name: 'Calendrier',
        tools: ['Renvoie les événements d’un jour donné.', 'Ajoute un événement au calendrier.'],
      },
      files: {
        name: 'Fichiers',
        tools: ['Renvoie le texte d’un fichier.', 'Trouve les fichiers dont le texte correspond à une requête.'],
      },
      weather: {
        name: 'Météo',
        tools: ['Renvoie les prévisions météo d’une ville.'],
      },
    },
    line: '{call} : {description}',
    none: '(aucun outil connecté)',
    stat: {
      one: '{n} outil proposé. Sa description occupe {tokens} tokens de la fenêtre de contexte avant que vous ayez tapé un mot.',
      other: '{n} outils proposés. Leurs descriptions occupent {tokens} tokens de la fenêtre de contexte avant que vous ayez tapé un mot.',
    },
  },

  hardware: {
    machines: {
      phone: 'iPhone 18 Pro',
      laptop: 'Ordinateur portable sans carte graphique',
      pc: 'PC avec une carte graphique de 24 Go',
      mac: 'Mac avec 64 Go de mémoire unifiée',
      spark: 'NVIDIA DGX Spark, 128 Go',
      studio: 'Mac Studio avec M5 Ultra, 512 Go',
      server: 'Un GPU de centre de données, avec sa part du serveur',
    },
    sorts: { listed: 'Ordre de la liste', speed: 'Les plus rapides', efficiency: 'Le plus par watt' },
    size: '{parameters} milliards de paramètres à {bits} bits par poids : {size} Go.',
    sizeTooBig: '{parameters} milliards de paramètres à {bits} bits par poids : {size} Go. Aucune de ces machines ne peut contenir ce modèle. Il faut environ {cards} GPU de centre de données travaillant ensemble.',
    specs: '{memory} Go · lit {bandwidth} Go/s · {watts} W',
    yes: 'Oui',
    no: 'Non',
    doesNotRun: 'ne tourne pas',
  },

  robot: {
    actions: [
      { output: '(rien pour l’instant)', note: 'L’image de la caméra et la consigne entrent : « Mets le cube dans le bol. »' },
      { output: 'aller à droite 80, pince ouverte', note: 'Le modèle voit le cube sur la droite et se place au-dessus.' },
      { output: 'descendre 110, pince ouverte', note: 'Il abaisse la pince ouverte autour du cube.' },
      { output: 'rester, fermer la pince', note: 'Il ferme la pince. Désormais, le cube se déplace avec elle.' },
      { output: 'monter 110, pince fermée', note: 'Il soulève le cube au-dessus de la table.' },
      { output: 'aller à droite 260, pince fermée', note: 'Il porte le cube jusqu’au bol.' },
      { output: 'descendre 110, pince fermée', note: 'Il descend le cube dans le bol.' },
      { output: 'rester, ouvrir la pince', note: 'Il lâche prise. Le cube reste où il est.' },
      { output: 'monter 110, pince ouverte', note: 'Il s’éloigne. La tâche est accomplie.' },
    ],
    bowl: 'bol',
    stat: 'Instant {n} sur {total} : {note}',
  },

  search: {
    stopWords: ['le', 'la', 'les', 'l', 'un', 'une', 'des', 'du', 'de', 'd', 'et', 'ou', 'est', 'sont', 'que', 'qu', 'quoi', 'comment', 'pourquoi', 'à', 'au', 'aux', 'en', 'dans', 'sur', 'pour', 'par', 'ce', 'c'],
    endings: ['s', 'x'],
    placeEvent: '{place} · {year}',
    placeOptional: '{place} · facultatif',
    hint: 'Tapez un mot, par exemple « token », « MCP » ou « AlphaFold ».',
    results: { one: '{n} endroit', other: '{n} endroits' },
    resultsOrMore: '{n} endroits ou plus',
    nothing: 'Aucun résultat.',
  },

  narration: {
    listen: 'Écouter',
    listenLabel: 'Écouter : {title}',
    pause: 'Pause',
    pauseLabel: 'Mettre en pause : {title}',
    failed: 'L’enregistrement n’a pas pu être lu. Réessayer',
    failedLabel: 'Lecture impossible : {title}. Réessayer',
  },

  papers: {
    attention: {
      by: 'Vaswani et autres, 2017',
      summary: 'Jusque-là, la plupart des modèles de langage lisaient une phrase mot après mot. Cet article y renonce et s’appuie sur la seule attention, si bien que tous les mots sont traités en même temps. Un tel réseau, le transformer, s’entraîne bien plus vite sur bien plus de texte.',
    },
    bengio: {
      by: 'Bengio et autres, 2003',
      summary: 'Remplace le comptage des suites de mots par un réseau de neurones. Celui-ci apprend un vecteur pour chaque mot, de sorte que des mots proches reçoivent des vecteurs proches, et s’en sert pour prédire le mot suivant.',
    },
    alexnet: {
      by: 'Krizhevsky, Sutskever et Hinton, 2012',
      summary: 'Un réseau profond entraîné sur deux cartes graphiques remporte le principal concours de reconnaissance d’images avec bien moins d’erreurs que le deuxième. Il a convaincu la discipline que réseaux profonds, grands jeux de données et GPU vont ensemble.',
    },
    word2vec: {
      by: 'Mikolov et autres, 2013',
      summary: 'Un réseau très simple apprend des vecteurs de mots à partir de plus d’un milliard de mots en moins d’une journée. Il s’avère que ces vecteurs saisissent des relations : le pas de « man » à « woman » ressemble au pas de « king » à « queen ».',
    },
    bahdanau: {
      by: 'Bahdanau, Cho et Bengio, 2014',
      summary: 'Les réseaux de traduction antérieurs comprimaient une phrase entière en un seul vecteur. Ici, pour chaque mot qu’il écrit, le réseau se retourne vers les mots de la phrase d’origine qui comptent. C’est le premier usage de l’attention en traduction, l’idée sur laquelle le transformer s’appuiera plus tard.',
    },
    distill: {
      by: 'Hinton, Vinyals et Dean, 2015',
      summary: 'Un petit réseau est entraîné à reproduire toutes les probabilités que donne un grand réseau, et pas seulement sa meilleure réponse. Il devient bien meilleur que s’il avait appris à partir des seules données.',
    },
    moe: {
      by: 'Jacobs, Jordan, Nowlan et Hinton, 1991',
      summary: 'Plusieurs petits réseaux apprennent chacun une partie d’une tâche, et un réseau d’aiguillage apprend auquel se fier pour chaque entrée. Les modèles actuels à mélange d’experts reprennent la même idée dans chaque couche.',
    },
    bpe: {
      by: 'Sennrich, Haddow et Birch, 2015',
      summary: 'Les modèles de traduction de l’époque connaissaient une liste fixe de mots entiers et échouaient sur tous les autres. Découper les mots rares en morceaux fréquents, grâce à l’encodage par paires d’octets, permet à un modèle de lire et d’écrire n’importe quel mot.',
    },
    vit: {
      by: 'Dosovitskiy et autres, 2020',
      summary: 'Découpe une image en petits patchs carrés et les donne à un transformer ordinaire comme s’il s’agissait de mots. Avec assez d’images d’entraînement, il égale les réseaux conçus spécialement pour la vision.',
    },
    clip: {
      by: 'Radford et autres, 2021',
      summary: 'Entraîné sur 400 millions d’images accompagnées de leur légende, le modèle apprend à placer une image et sa description l’une près de l’autre. Il peut ensuite reconnaître, à partir d’une simple description, des choses qu’on ne lui a jamais apprises explicitement.',
    },
    bitnet: {
      by: 'Ma et autres, 2024',
      summary: 'Un modèle de langage entraîné dès le départ avec des poids limités à −1, 0 ou +1. Il s’approche d’un modèle ordinaire de même taille tout en demandant bien moins de mémoire et d’énergie.',
    },
    ttt: {
      by: 'Sun et autres, 2019',
      summary: 'Avant de répondre, le modèle s’entraîne brièvement sur l’entrée même qu’il a sous les yeux, au moyen d’une tâche qui ne demande aucune étiquette. Cela aide lorsque l’entrée diffère des données d’entraînement.',
    },
    tttLlm: {
      by: 'Akyürek et autres, 2024',
      summary: 'Applique l’entraînement au moment du test à un modèle de langage : un court entraînement sur les exemples de chaque énigme avant de répondre. Le taux de réussite aux énigmes ARC est multiplié plusieurs fois.',
    },
    gpt1: {
      by: 'Radford et autres, 2018',
      summary: 'Le premier GPT. Un transformer est d’abord entraîné à prédire le mot suivant sur des milliers de livres, puis adapté sans grand effort à de nombreuses tâches de langage différentes.',
    },
    gpt2: {
      by: 'Radford et autres, 2019',
      summary: 'GPT-2. Un modèle plus grand, entraîné sur le texte de millions de pages web, écrit des paragraphes cohérents et s’acquitte de tâches comme le résumé sans y avoir été entraîné.',
    },
    gpt3: {
      by: 'Brown et autres, 2020',
      summary: 'GPT-3, avec 175 milliards de paramètres. Si on lui montre quelques exemples dans le prompt, il accomplit de nouvelles tâches sans aucun entraînement supplémentaire.',
    },
    bert: {
      by: 'Devlin et autres, 2018',
      summary: 'Un transformer entraîné à retrouver des mots masqués en s’aidant du texte situé des deux côtés du trou. Il lit mais n’écrit pas, et a établi de nouveaux records aux tests de compréhension du langage.',
    },
    rag: {
      by: 'Lewis et autres, 2020',
      summary: 'Avant de répondre, le système cherche des passages pertinents dans une grande collection de textes et les donne au modèle avec la question. Les réponses gagnent en exactitude et peuvent être tenues à jour.',
    },
    nucleus: {
      by: 'Holtzman et autres, 2019',
      summary: 'Toujours choisir le mot le plus probable rend le texte terne et répétitif ; choisir librement le rend incohérent. L’article propose de ne tirer que parmi le plus petit ensemble de mots qui, réunis, sont assez probables : le top-p.',
    },
    cot: {
      by: 'Wei et autres, 2022',
      summary: 'Si les exemples d’un prompt montrent les étapes du raisonnement et pas seulement la réponse, le modèle écrit lui aussi ses étapes et résout beaucoup plus de problèmes de calcul et de logique.',
    },
    react: {
      by: 'Yao et autres, 2022',
      summary: 'Le modèle alterne entre écrire une réflexion, demander une action telle qu’une recherche, et lire le résultat. Cette boucle est le schéma de base des agents d’aujourd’hui.',
    },
    prefs: {
      by: 'Christiano et autres, 2017',
      summary: 'On montre à des personnes deux courts extraits du comportement d’un système, et elles disent lequel est le meilleur. À partir de ces seules comparaisons, il apprend des tâches pour lesquelles personne ne saurait écrire une note.',
    },
    instructgpt: {
      by: 'Ouyang et autres, 2022',
      summary: 'InstructGPT. Un modèle de langage poursuit son entraînement sur des démonstrations humaines et sur des classements humains de ses réponses. Les gens préfèrent ses réponses à celles d’un modèle cent fois plus grand.',
    },
    lora: {
      by: 'Hu et autres, 2021',
      summary: 'Pour adapter un modèle, on laisse tous ses poids intacts et on entraîne un petit ajout à côté. Il faut une fraction de la mémoire, et l’ajout est un petit fichier que l’on peut échanger.',
    },
    rt2: {
      by: 'Brohan et autres, 2023',
      summary: 'Un modèle qui comprend les images et le texte est entraîné à écrire des mouvements de robot sous forme de tokens. Le robot peut alors suivre des consignes portant sur des objets qu’il n’a jamais rencontrés pendant son entraînement de robot.',
    },
    graphcast: {
      by: 'Lam et autres, 2022 ; dans Science, 2023',
      summary: 'Un réseau entraîné sur quarante ans de relevés météorologiques produit en moins d’une minute une prévision à dix jours pour le globe entier, et bat le meilleur système classique sur la plupart des mesures testées.',
    },
    alphafold: {
      by: 'Jumper et autres, 2021',
      summary: 'Décrit AlphaFold 2, qui prédit la forme en trois dimensions d’une protéine à partir de la suite de ses éléments constitutifs, dans bien des cas avec la précision d’une expérience.',
    },
    mcculloch: {
      by: 'McCulloch et Pitts, 1943',
      summary: 'Décrit une cellule nerveuse comme un simple interrupteur : elle s’active ou non, selon les signaux qu’elle reçoit. Les auteurs montrent que des réseaux de telles cellules peuvent effectuer les opérations de la logique. Ces cellules n’apprennent pas encore, mais les réseaux de neurones artificiels sont nés de cette image.',
    },
    shannon: {
      by: 'Shannon, 1948',
      summary: 'L’article fondateur de la théorie de l’information : il mesure l’information en bits et montre quelle quantité une ligne bruitée peut en transmettre. Au passage, Shannon fabrique du texte qui ressemble à de l’anglais en choisissant chaque lettre ou chaque mot d’après la fréquence avec laquelle il suit les précédents. C’est un modèle de langage en miniature.',
    },
    turing: {
      by: 'Turing, 1950',
      summary: 'Turing remplace la question « Les machines peuvent-elles penser ? » par un jeu : un juge échange des messages écrits avec une personne et une machine, et doit dire qui est qui. Il répond ensuite une à une à neuf objections, dont celle d’Ada Lovelace, et termine par des idées pour une machine qui apprendrait comme un enfant.',
    },
    dartmouth: {
      by: 'McCarthy, Minsky, Rochester et Shannon, 1955',
      summary: 'Une demande de financement pour un atelier d’été en 1956 : dix chercheurs, deux mois. Elle repose sur la conjecture que chaque aspect de l’apprentissage et de l’intelligence peut être décrit assez précisément pour qu’une machine le simule. L’expression « intelligence artificielle » vient de cette proposition.',
    },
    perceptron: {
      by: 'Rosenblatt, 1958',
      summary: 'La théorie d’un psychologue sur la façon dont un cerveau pourrait conserver ce qu’il perçoit : non pas sous forme d’images stockées, mais dans la force des connexions entre ses cellules. Le perceptron, construit sur cette idée, apprend à partir d’exemples à distinguer des motifs, à mesure que ses connexions se renforcent ou s’affaiblissent.',
    },
    wiener: {
      by: 'Wiener, 1960',
      summary: 'Wiener explique que des machines qui apprennent peuvent développer des stratégies que leurs constructeurs n’avaient pas prévues, et agir plus vite que les humains ne peuvent intervenir. Si nous ne pouvons plus arrêter une machine une fois lancée, écrit-il, mieux vaut être tout à fait sûrs que le but que nous lui avons donné est bien celui que nous voulons.',
    },
    good: {
      by: 'Good, 1965',
      summary: 'Définit une « machine ultra-intelligente » comme une machine qui surpasse de loin les humains dans toutes les activités intellectuelles. Concevoir des machines étant l’une de ces activités, elle pourrait en concevoir de meilleures encore, et Good s’attend à une « explosion d’intelligence ». La phrase si souvent citée sur la dernière invention vient de ce texte.',
    },
    eliza: {
      by: 'Weizenbaum, 1966',
      summary: 'Weizenbaum explique comment son programme mène une conversation : il cherche des mots-clés dans ce que l’utilisateur a tapé et réarrange la phrase selon des règles fixes. Son script le plus connu imite un psychothérapeute. Il expose le mécanisme à dessein, pour que l’impression de compréhension se dissipe.',
    },
    searle: {
      by: 'Searle, 1980',
      summary: 'Présente la chambre chinoise : une personne qui suit des règles portant sur des caractères chinois donne les bonnes réponses sans comprendre un mot. Searle en conclut qu’exécuter un programme ne suffit jamais, à lui seul, pour comprendre. La revue a publié l’article accompagné des répliques de nombreux autres chercheurs et de ses réponses.',
    },
    backprop: {
      by: 'Rumelhart, Hinton et Williams, 1986',
      summary: 'Décrit une procédure qui ajuste encore et encore les poids d’un réseau, pour que sa sortie se rapproche de celle que l’on attend. Ce faisant, les couches internes, auxquelles personne ne dicte rien directement, en viennent à représenter des caractéristiques utiles de la tâche. D’autres avaient trouvé la méthode plus tôt ; cet article l’a fait connaître.',
    },
    hawking: {
      by: 'Rory Cellan-Jones, BBC News, 2014',
      summary: 'Interrogé sur son nouveau système de parole, qui utilise une forme simple d’IA pour lui suggérer les mots suivants, Hawking dit que de tels outils se sont révélés très utiles. Mais une machine qui égalerait ou dépasserait les humains se reconcevrait elle-même à un rythme toujours plus rapide, et les humains, limités par la lenteur de l’évolution biologique, ne pourraient pas rivaliser.',
    },
    alphago: {
      by: 'Silver et autres, 2016',
      summary: 'Décrit AlphaGo : un réseau de neurones propose des coups, un second évalue les positions, et une recherche combine les deux. Les réseaux ont appris à partir de parties d’experts humains et de parties que le programme a jouées contre lui-même. L’article rapporte une victoire 5 à 0 contre le champion d’Europe ; le match contre Lee Sedol a suivi en mars 2016.',
    },
    gnmt: {
      by: 'Wu et autres, 2016',
      summary: 'Décrit le réseau de neurones derrière le nouveau Google Traduction. Il lit une phrase et écrit la traduction en s’aidant de l’attention, et il découpe les mots rares en morceaux. Sur des phrases simples évaluées par des personnes, il a fait environ 60 % d’erreurs en moins que le système précédent, qui assemblait des segments de phrase.',
    },
    bitterLesson: {
      by: 'Sutton, 2019',
      summary: 'Un court essai sur soixante-dix ans de recherche en IA. Aux échecs, au go, en reconnaissance vocale et en vision par ordinateur, les méthodes fondées sur la connaissance humaine du sujet ont d’abord aidé, puis ont été dépassées par des méthodes générales, la recherche et l’apprentissage, qui progressent avec la puissance de calcul. Sutton appelle cela la leçon amère.',
    },
    parrots: {
      by: 'Bender, Gebru et autres, 2021',
      summary: 'Demande si les modèles de langage peuvent être trop grands. L’article énumère les coûts de modèles toujours plus gros : l’énergie qu’ils consomment, des textes d’entraînement trop vastes pour être vérifiés et porteurs de préjugés, et des lecteurs qui prennent un texte fluide pour de la compréhension. Il qualifie un tel modèle de « perroquet stochastique », qui assemble des suites de mots selon leur probabilité, sans référence au sens.',
    },
    mcp: {
      by: 'Anthropic, 2024',
      summary: 'L’annonce d’Anthropic du 25 novembre 2024. Jusque-là, chaque source de données exigeait sa propre connexion sur mesure à un système d’IA ; MCP les remplace par un protocole ouvert unique. La spécification, des kits de développement et une collection de serveurs prêts à l’emploi ont été publiés en open source le même jour.',
    },
    geminiEnergy: {
      by: 'Elsworth et autres, 2025',
      summary: 'Google mesure l’énergie, les émissions et l’eau que consomme la réponse aux prompts dans ses propres centres de données, en comptant non seulement les puces d’IA, mais aussi les machines qui les hébergent, la capacité inutilisée et le fonctionnement du centre. Le prompt textuel médian adressé à Gemini revient à 0,24 wattheure, moins que neuf secondes de télévision. C’est une mesure de l’entreprise elle-même, et elle porte sur la réponse aux prompts, pas sur l’entraînement.',
    },
    gentleSingularity: {
      by: 'Altman, 2025',
      summary: 'Un essai du directeur général d’OpenAI sur les années à venir. Dans une remarque entre parenthèses, il indique qu’une requête moyenne à ChatGPT consomme environ 0,34 wattheure, à peu près ce qu’une ampoule à haute efficacité consomme en quelques minutes. L’essai ne dit pas comment ce chiffre a été mesuré.',
    },
  },
};
