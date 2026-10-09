// Deutsch: every text the scripts put on the page. Same entries in the same
// order as i18n/en.js, which also explains the shape; tools/check_i18n.py
// compares the files. The reader is addressed as "Sie". English technical
// words that German keeps (Token, Prompt, Embedding, Tool, Harness) stay.

const STRINGS = {
  lang: 'de',
  locale: 'de-DE',

  glossary: 'Glossar',

  units: {
    bits: '{n} Bit',
    gb: '{n} GB',
    // An English billion is a Milliarde, an English trillion a Billion.
    billions: '{n} Mrd.',
    trillions: '{n} Bio.',
    tokensPerSecond: '{n} Tokens/s',
  },

  // German inflects: a mention may add any of these endings to a glossary
  // term. Other forms are listed in data-also on the term's dt in the page.
  terms: {
    endings: ['en', 'es', 'er', 'e', 'n', 's'],
    dropped: [],
  },

  bars: {
    title: '{label}: {value}',
  },

  map: {
    groups: { animals: 'Tiere', home: 'Zuhause', language: 'Sprache', food: 'Essen', actions: 'Tätigkeiten' },
    notEdible: 'nicht essbar',
    edible: 'essbar',
    hits: 'Aus Ihrem Prompt: {words}',
    none: 'Keines Ihrer Wörter steht auf dieser kleinen Karte. Probieren Sie: cat, garden, milk.',
  },

  patch: {
    label: 'Patch {n}',
    stat: 'Patch {n} von {total} wird zu einem Vektor',
  },

  layers: {
    embedding: 'Embedding, vor der ersten Schicht',
    layer: 'Schicht {n}',
    vectorAtStart: 'Vektor für {token} direkt aus dem Embedding, vor der ersten Schicht',
    vectorAfter: 'Vektor für {token} nach Schicht {layer} von {total}',
  },

  network: {
    columns: ['Eingabe', 'Neuronen', 'Neuronen', 'Ausgabe'],
    hint: 'Jeder Kreis ist ein Neuron und jede Linie ein Gewicht: Blau steht für negativ, Orange für positiv. Eine Linie ist umso kräftiger, je mehr Signal über sie läuft. Zeigen Sie auf ein Neuron oder nutzen Sie die Pfeiltasten.',
    input: 'Ein Eingang: Zahl {n} aus dem Vektor des Tokens, {value}. Hier wird noch nichts berechnet.',
    neuron: 'Dieses Neuron multipliziert jeden seiner {inputs} Eingänge mit dem Gewicht auf dessen Linie und zählt alles zusammen: {sum}. In den Bereich von -1 bis 1 gestaucht, gibt es {value} weiter.',
  },

  quantization: {
    label: 'Mit {bits} Bit gespeichert: Jedes Gewicht ist einer von {values} erlaubten Werten',
    error: 'Mittlerer Rundungsfehler: {error}',
    errorTiny: 'Mittlerer Rundungsfehler: weniger als {limit}',
  },

  testTime: {
    after: {
      one: 'Dieselben Gewichte nach {n} Trainingsschritt mit dieser Anfrage',
      other: 'Dieselben Gewichte nach {n} Trainingsschritten mit dieser Anfrage',
    },
  },

  attention: {
    stat: '„{from}“ bezieht am meisten von „{to}“ ({share}).',
  },

  experts: {
    tile: 'E{n}',
    stat: 'Der Router schickt „{token}“ an die Experten {names}. Die anderen {rest} tun für dieses Token nichts.',
  },

  prediction: {
    rest: {
      one: '{n} weiteres Token hat die übrigen {share}.',
      other: '{n} weitere Tokens teilen sich die übrigen {share}.',
    },
  },

  sampling: {
    rest: {
      one: '{n} weiteres Token hat die übrigen {share}. Auch es hat Lose.',
      other: '{n} weitere Tokens teilen sich die übrigen {share}. Auch sie haben Lose.',
    },
    picked: '„{token}“ gezogen',
    pickedUnseen: '„{token}“ gezogen, eines der nicht gezeigten Tokens',
  },

  loop: {
    stop: 'Stopp',
    stat: {
      one: '{n} Token angefügt, {n} Durchlauf durch das Modell.',
      other: '{n} Tokens angefügt, {n} Durchläufe durch das Modell.',
    },
  },

  retrieval: {
    score: { one: '{n} gemeinsames Wort', other: '{n} gemeinsame Wörter' },
    nothing: '(Nichts in der Bibliothek passt, also geht der Prompt unverändert hinein.)',
  },

  transcript: {
    stat: 'Schritt {n} von {total}: {note}',
  },

  agent: {
    question: 'Was ist {factors}?',
    answer: '{factors} ist {product}.',
    notes: [
      'Die Frage kommt als Text an, wie jeder Prompt.',
      'Das Modell rät nicht. Es schreibt eine Anfrage an das Taschenrechner-Tool.',
      'Gewöhnliche Software führt den Taschenrechner aus und fügt das Ergebnis in den Text ein.',
      'Die Schleife läuft weiter: Mit dem Ergebnis im Kontextfenster schreibt das Modell die Antwort.',
    ],
  },

  cost: {
    input: 'Eingabe',
    cached: 'Mit Cache',
    compacted: 'Verdichtet',
    output: 'Ausgabe',
    stat: {
      one: 'Nach {n} Wortwechsel hat das Modell {input} Tokens gelesen und {output} geschrieben. Mit Caching wird das Lesen wie {cached} Tokens berechnet. Mit Verdichtung werden überhaupt nur {compacted} gelesen.',
      other: 'Nach {n} Wortwechseln hat das Modell {input} Tokens gelesen und {output} geschrieben. Mit Caching wird das Lesen wie {cached} Tokens berechnet. Mit Verdichtung werden überhaupt nur {compacted} gelesen.',
    },
  },

  load: {
    names: { cpu: 'CPU', gpu: 'GPU', memory: 'Speicher' },
    levels: ['kaum genutzt', 'niedrig', 'mittel', 'hoch'],
    title: '{name}: {level}',
  },

  classifier: {
    none: 'Kein Hinweis auf eine der Antworten: Alle sind gleich wahrscheinlich.',
    tied: { one: '{n} Antwort liegt gleichauf bei {share}.', other: '{n} Antworten liegen gleichauf bei {share}.' },
    top: 'Am wahrscheinlichsten: {choice} ({share}).',
  },

  tooltip: {
    paperFirst: 'Ein Klick hält diesen Hinweis fest, ein zweiter öffnet die Quelle.',
    paperOpen: 'Noch ein Klick öffnet die Quelle.',
    paperTitle: '{title} ({by})',
  },

  rail: {
    glossaryMark: 'G',
  },

  extras: {
    closeAll: 'Alle schließen',
    openAll: 'Alle {n} öffnen',
  },

  reading: {
    nothing: 'Noch nichts gelesen.',
    last: 'Gerade gelesen: „{sentence}“',
    chartStart: 'nichts gelesen',
    chartEnd: 'alle {n} Sätze gelesen',
  },

  descent: {
    rates: ['Kleine Schritte', 'Mittlere Schritte', 'Zu groß'],
    low: 'Gewicht zu niedrig',
    high: 'Gewicht zu hoch',
    start: 'Start',
    step: 'Schritt {n}',
    stat: '{position}: Gewicht {weight}, Verlust {loss}.',
    statOffChart: '{position}: Gewicht {weight}, Verlust {loss}. Außerhalb des Diagramms: Jeder Schritt schießt jetzt noch weiter über das Ziel hinaus.',
    statSettled: '{position}: Gewicht {weight}, Verlust {loss}. Am tiefsten Punkt: Weitere Schritte ändern fast nichts mehr.',
  },

  tuning: {
    base: 'Basismodell',
    tuned: 'Nach dem Nachtraining',
    prompt: 'Was ist die Hauptstadt von Frankreich?',
    baseText: ' Was ist die Hauptstadt von Spanien? Was ist die Hauptstadt von Italien? Testen Sie Ihr Wissen mit unserem Geografie-Quiz und',
    baseNote: 'Das Basismodell hält die Frage für den Anfang eines Dokuments und schreibt im selben Stil weiter.',
    tunedText: '\nDie Hauptstadt von Frankreich ist Paris.',
    tunedNote: 'Nach dem Nachtraining wird derselbe Text als Frage behandelt, die zu beantworten ist.',
  },

  feedback: {
    pairs: [
      {
        prompt: 'Erkläre einem zehnjährigen Kind, was ein Token ist.',
        answers: [
          'Ein Token ist eine Teilworteinheit, die ein Byte-Pair-Encoding-Tokenizer erzeugt.',
          'Ein Token ist ein kleines Stück von einem Wort, wie ein Baustein. Der Computer baut jeden Satz aus solchen Stücken.',
        ],
      },
      {
        prompt: 'Ist die Erde flach?',
        answers: [
          'Nein. Die Erde ist rund; das wurde auf viele voneinander unabhängige Arten gemessen.',
          'Dazu gibt es verschiedene Ansichten, und es steht mir nicht zu, das zu beurteilen.',
        ],
      },
      {
        prompt: 'Mein Programm stürzt ab. Repariere es.',
        answers: [
          'Erledigt! Jetzt sollte es laufen.',
          'Ich helfe gern. Bitte zeig mir die Fehlermeldung und die Stelle im Code, an der es passiert.',
        ],
      },
    ],
    next: 'Vergleich {n} von {total}. Klicken Sie auf die Antwort, die Ihnen besser gefällt.',
    done: 'Alle {n} bewertet (Sie haben {letters} vorgezogen). Jede Wahl wird zu einem Signal: Antworten wie die bevorzugte sollen wahrscheinlicher werden.',
  },

  evaluation: {
    readBefore: 'Schon gelesen',
    neverRead: 'Nie gelesen',
    sentences: 'Nie gelesen: {sentences}',
  },

  lora: {
    rank: 'Rang {n}',
    full: 'Ganze Tabelle',
    addOn: 'Zusatz',
    stat: 'Im Zusatz werden {share} so viele Gewichte trainiert wie in der ganzen Tabelle.',
  },

  autonomy: [
    {
      label: 'Chatbot',
      decides: 'Sie, nach jeder einzelnen Antwort.',
      touches: 'Nichts. Er schreibt nur Text.',
      example: 'Eine Frage stellen und die Antwort lesen.',
    },
    {
      label: 'Assistent mit Tools',
      decides: 'Das Modell, für ein paar Runden. Alles Wichtige geben Sie frei.',
      touches: 'Die Tools, die Sie eingeschaltet haben, etwa eine Suche oder einen Taschenrechner.',
      example: '„Finde drei Flüge für Freitag und vergleiche sie.“',
    },
    {
      label: 'Autonomer Agent',
      decides: 'Das Modell, über Hunderte von Runden; es meldet sich nur selten zurück.',
      touches: 'Dateien, Programme und Onlinedienste, im Rahmen seiner Berechtigungen.',
      example: '„Behebe diesen Fehler und mach weiter, bis alle Tests bestehen.“',
    },
  ],

  harness: {
    actors: {
      harness: { label: 'Harness', inSentence: 'der Harness' },
      model: { label: 'Modell', inSentence: 'das Modell' },
    },
    stations: [
      { title: 'Eingabe bauen', note: 'Er fügt den System-Prompt, die Tool-Beschreibungen, das bisherige Gespräch und die neuesten Ergebnisse zu einem Text zusammen.' },
      { title: 'Modell schreibt', note: 'Es liest diesen Text und schreibt entweder eine Antwort oder eine Tool-Anfrage. Dies ist die einzige Station, an der das Modell beteiligt ist.' },
      { title: 'Ausgabe lesen', note: 'Er prüft, was zurückgekommen ist. Eine einfache Antwort beendet die Schleife; bei einer Tool-Anfrage geht es weiter.' },
      { title: 'Prüfen und ausführen', note: 'Er prüft die Anfrage anhand seiner Regeln, fragt Sie bei Bedarf und führt dann das Tool aus.' },
      { title: 'Ergebnis festhalten', note: 'Er fügt das Ergebnis dem Gespräch hinzu und kürzt ältere Teile, wenn das Kontextfenster voll wird. Dann beginnt die nächste Runde.' },
    ],
    tile: '{n}. {title}',
    stat: 'Runde {round}, Station {n} ({actor}): {note}',
  },

  chain: {
    question: 'Wie viele Stunden hat dieses Jahr noch?',
    answer: 'Dieses Jahr hat noch etwa {hours} Stunden, gerechnet ab Beginn des heutigen Tages.',
    notes: [
      'Eine Frage, aber kein einzelnes Tool kann sie beantworten.',
      'Das Modell hat keine Uhr. Wenn das Datum nicht in seiner Eingabe steht, muss es danach fragen.',
      'Der Harness führt das Tool aus. Das ist das echte Datum auf Ihrem Gerät.',
      'Das erste Ergebnis ist Teil der zweiten Anfrage geworden.',
      'Von dieser Seite berechnet.',
      'Das zweite Ergebnis fließt in die dritte Anfrage ein.',
      'Von dieser Seite berechnet.',
      'Erst jetzt antwortet das Modell. Drei Tools, jedes baut auf dem vorherigen auf.',
    ],
  },

  mcp: {
    servers: {
      calendar: {
        name: 'Kalender',
        tools: ['Gibt die Termine eines bestimmten Tages zurück.', 'Trägt einen Termin in den Kalender ein.'],
      },
      files: {
        name: 'Dateien',
        tools: ['Gibt den Text einer Datei zurück.', 'Findet Dateien, deren Text zu einer Suchanfrage passt.'],
      },
      weather: {
        name: 'Wetter',
        tools: ['Gibt die Wettervorhersage für eine Stadt zurück.'],
      },
    },
    line: '{call}: {description}',
    none: '(keine Tools verbunden)',
    stat: {
      one: '{n} Tool im Angebot. Seine Beschreibung belegt {tokens} Tokens des Kontextfensters, bevor Sie ein Wort getippt haben.',
      other: '{n} Tools im Angebot. Ihre Beschreibungen belegen {tokens} Tokens des Kontextfensters, bevor Sie ein Wort getippt haben.',
    },
  },

  hardware: {
    machines: {
      phone: 'iPhone 18 Pro',
      laptop: 'Laptop ohne Grafikkarte',
      pc: 'PC mit einer 24-GB-Grafikkarte',
      mac: 'Mac mit 64 GB gemeinsamem Speicher',
      spark: 'NVIDIA DGX Spark, 128 GB',
      studio: 'Mac Studio mit M5 Ultra, 512 GB',
      server: 'Eine Rechenzentrums-GPU, mit ihrem Anteil am Server',
    },
    sorts: { listed: 'Wie aufgelistet', speed: 'Am schnellsten', efficiency: 'Am meisten pro Watt' },
    size: '{parameters} Milliarden Parameter bei {bits} Bit pro Gewicht: {size} GB.',
    sizeTooBig: '{parameters} Milliarden Parameter bei {bits} Bit pro Gewicht: {size} GB. Keines dieser Geräte kann das Modell aufnehmen. Dafür braucht es etwa {cards} Rechenzentrums-GPUs, die zusammenarbeiten.',
    specs: '{memory} GB · liest {bandwidth} GB/s · {watts} W',
    yes: 'Ja',
    no: 'Nein',
    doesNotRun: 'läuft nicht',
  },

  robot: {
    actions: [
      { output: '(noch nichts)', note: 'Das Kamerabild und die Anweisung gehen hinein: „Lege den Klotz in die Schale.“' },
      { output: 'nach rechts 80, Greifer offen', note: 'Das Modell sieht den Klotz rechts und fährt über ihn.' },
      { output: 'nach unten 110, Greifer offen', note: 'Es senkt den offenen Greifer um den Klotz.' },
      { output: 'bleiben, Greifer schließen', note: 'Es schließt den Greifer. Von jetzt an bewegt sich der Klotz mit.' },
      { output: 'nach oben 110, Greifer geschlossen', note: 'Es hebt den Klotz vom Tisch.' },
      { output: 'nach rechts 260, Greifer geschlossen', note: 'Es trägt den Klotz hinüber zur Schale.' },
      { output: 'nach unten 110, Greifer geschlossen', note: 'Es senkt den Klotz in die Schale.' },
      { output: 'bleiben, Greifer öffnen', note: 'Es lässt los. Der Klotz bleibt, wo er ist.' },
      { output: 'nach oben 110, Greifer offen', note: 'Es fährt weg. Die Aufgabe ist erledigt.' },
    ],
    bowl: 'Schale',
    stat: 'Moment {n} von {total}: {note}',
  },

  search: {
    stopWords: ['der', 'die', 'das', 'den', 'dem', 'des', 'ein', 'eine', 'einer', 'eines', 'einem', 'einen', 'und', 'oder', 'ist', 'sind', 'was', 'wie', 'warum', 'wieso', 'im', 'in', 'am', 'an', 'auf', 'zu', 'zum', 'zur', 'von', 'vom', 'mit', 'für'],
    endings: ['en', 'es', 'er', 'e', 'n', 's'],
    placeEvent: '{place} · {year}',
    placeOptional: '{place} · optional',
    hint: 'Tippen Sie ein Wort ein, zum Beispiel „Token“, „MCP“ oder „AlphaFold“.',
    results: { one: '{n} Stelle', other: '{n} Stellen' },
    resultsOrMore: '{n} oder mehr Stellen',
    nothing: 'Nichts gefunden.',
  },

  narration: {
    listen: 'Anhören',
    listenLabel: 'Anhören: {title}',
    pause: 'Pause',
    pauseLabel: 'Anhalten: {title}',
    failed: 'Die Aufnahme konnte nicht abgespielt werden. Noch einmal versuchen',
    failedLabel: 'Nicht abspielbar: {title}. Noch einmal versuchen',
  },

  papers: {
    attention: {
      by: 'Vaswani und andere, 2017',
      summary: 'Bis dahin lasen die meisten Sprachmodelle einen Satz Wort für Wort. Diese Arbeit verzichtet darauf und stützt sich allein auf Attention, sodass alle Wörter gleichzeitig verarbeitet werden. Ein solches Netz, der Transformer, lässt sich viel schneller mit viel mehr Text trainieren.',
    },
    bengio: {
      by: 'Bengio und andere, 2003',
      summary: 'Ersetzt das Zählen von Wortfolgen durch ein neuronales Netz. Es lernt für jedes Wort einen Vektor, sodass ähnliche Wörter ähnliche Vektoren bekommen, und sagt daraus das nächste Wort vorher.',
    },
    alexnet: {
      by: 'Krizhevsky, Sutskever und Hinton, 2012',
      summary: 'Ein tiefes Netz, auf zwei Grafikkarten trainiert, gewinnt den führenden Wettbewerb der Bilderkennung mit weit weniger Fehlern als der Zweitplatzierte. Das überzeugte das Fachgebiet davon, dass tiefe Netze, große Datensätze und GPUs zusammengehören.',
    },
    word2vec: {
      by: 'Mikolov und andere, 2013',
      summary: 'Ein sehr einfaches Netz lernt Wortvektoren aus mehr als einer Milliarde Wörtern in weniger als einem Tag. Es zeigt sich, dass die Vektoren Beziehungen abbilden: Der Schritt von „man“ zu „woman“ ähnelt dem Schritt von „king“ zu „queen“.',
    },
    bahdanau: {
      by: 'Bahdanau, Cho und Bengio, 2014',
      summary: 'Frühere Übersetzungsnetze pressten einen ganzen Satz in einen einzigen Vektor. Hier blickt das Netz bei jedem Wort, das es schreibt, auf die Wörter des Ausgangstextes zurück, auf die es gerade ankommt. Es ist der erste Einsatz von Attention beim Übersetzen, die Idee, auf der später der Transformer aufbaut.',
    },
    distill: {
      by: 'Hinton, Vinyals und Dean, 2015',
      summary: 'Ein kleines Netz wird darauf trainiert, die vollständigen Wahrscheinlichkeiten eines großen wiederzugeben, nicht nur dessen beste Antwort. Am Ende ist es weit besser, als wenn es allein aus den Daten gelernt hätte.',
    },
    moe: {
      by: 'Jacobs, Jordan, Nowlan und Hinton, 1991',
      summary: 'Mehrere kleine Netze lernen je einen Teil einer Aufgabe, und ein weiteres Netz lernt, welchem davon es bei welcher Eingabe vertrauen soll. Heutige Mixture-of-Experts-Modelle nutzen dieselbe Idee in jeder Schicht.',
    },
    bpe: {
      by: 'Sennrich, Haddow und Birch, 2015',
      summary: 'Die Übersetzungsmodelle jener Zeit kannten eine feste Liste ganzer Wörter und scheiterten an allen anderen. Zerlegt man seltene Wörter mit Byte Pair Encoding in häufige Stücke, kann ein Modell jedes Wort lesen und schreiben.',
    },
    vit: {
      by: 'Dosovitskiy und andere, 2020',
      summary: 'Zerschneidet ein Bild in kleine quadratische Patches und gibt sie einem gewöhnlichen Transformer, als wären es Wörter. Mit genügend Trainingsbildern erreicht er die Leistung der Netze, die eigens für das Sehen gebaut wurden.',
    },
    clip: {
      by: 'Radford und andere, 2021',
      summary: 'Mit 400 Millionen Bildern samt Bildunterschriften trainiert, lernt das Modell, ein Bild und seine Beschreibung nah beieinander abzulegen. Danach erkennt es allein anhand einer Beschreibung auch Dinge, die ihm nie ausdrücklich beigebracht wurden.',
    },
    bitnet: {
      by: 'Ma und andere, 2024',
      summary: 'Ein Sprachmodell, bei dem von Anfang an jedes Gewicht nur −1, 0 oder +1 sein darf. Es kommt einem gewöhnlichen Modell gleicher Größe nahe und braucht dabei weit weniger Speicher und Energie.',
    },
    ttt: {
      by: 'Sun und andere, 2019',
      summary: 'Bevor das Modell antwortet, trainiert es kurz mit genau der Eingabe, die ihm vorliegt, anhand einer Aufgabe, die keine Beschriftungen braucht. Das hilft, wenn die Eingabe von den Trainingsdaten abweicht.',
    },
    tttLlm: {
      by: 'Akyürek und andere, 2024',
      summary: 'Wendet Test-Time-Training auf ein Sprachmodell an: vor der Antwort eine kurze Trainingsrunde mit den Beispielen des jeweiligen Rätsels. Die Trefferquote bei den ARC-Rätseln steigt auf ein Mehrfaches.',
    },
    gpt1: {
      by: 'Radford und andere, 2018',
      summary: 'Das erste GPT. Ein Transformer wird zunächst mit Tausenden von Büchern darauf trainiert, das nächste Wort vorherzusagen, und dann mit wenig Aufwand an viele verschiedene Sprachaufgaben angepasst.',
    },
    gpt2: {
      by: 'Radford und andere, 2019',
      summary: 'GPT-2. Ein größeres Modell, trainiert mit Text von Millionen von Webseiten, schreibt zusammenhängende Absätze und bewältigt Aufgaben wie das Zusammenfassen, ohne dafür trainiert worden zu sein.',
    },
    gpt3: {
      by: 'Brown und andere, 2020',
      summary: 'GPT-3, mit 175 Milliarden Parametern. Zeigt man ihm im Prompt ein paar Beispiele, erledigt es neue Aufgaben ganz ohne weiteres Training.',
    },
    bert: {
      by: 'Devlin und andere, 2018',
      summary: 'Ein Transformer, der darauf trainiert wird, verdeckte Wörter zu ergänzen, und dafür den Text auf beiden Seiten der Lücke nutzt. Er liest, schreibt aber nicht, und stellte neue Rekorde bei Tests zum Sprachverständnis auf.',
    },
    rag: {
      by: 'Lewis und andere, 2020',
      summary: 'Vor der Antwort sucht das System in einer großen Textsammlung passende Abschnitte heraus und gibt sie dem Modell zusammen mit der Frage. Die Antworten werden genauer und lassen sich aktuell halten.',
    },
    nucleus: {
      by: 'Holtzman und andere, 2019',
      summary: 'Wählt man immer das wahrscheinlichste Wort, wird der Text eintönig und wiederholt sich; wählt man frei, verliert er den Zusammenhang. Die Arbeit schlägt vor, nur aus der kleinsten Menge von Wörtern zu ziehen, die zusammen wahrscheinlich genug sind: Top-p.',
    },
    cot: {
      by: 'Wei und andere, 2022',
      summary: 'Zeigen die Beispiele in einem Prompt die einzelnen Denkschritte und nicht nur die Antwort, schreibt auch das Modell seine Schritte aus und löst deutlich mehr Rechen- und Logikaufgaben.',
    },
    react: {
      by: 'Yao und andere, 2022',
      summary: 'Das Modell wechselt zwischen drei Dingen: einen Gedanken aufschreiben, eine Aktion wie eine Suche anfordern und das Ergebnis lesen. Diese Schleife ist das Grundmuster heutiger Agenten.',
    },
    prefs: {
      by: 'Christiano und andere, 2017',
      summary: 'Menschen sehen zwei kurze Ausschnitte aus dem Verhalten eines Systems und sagen, welcher besser ist. Allein aus solchen Vergleichen lernt es Aufgaben, für die niemand eine Punktzahl aufschreiben könnte.',
    },
    instructgpt: {
      by: 'Ouyang und andere, 2022',
      summary: 'InstructGPT. Ein Sprachmodell wird mit Vorführungen von Menschen und mit ihren Ranglisten seiner Antworten weitertrainiert. Menschen ziehen seine Antworten denen eines hundertmal größeren Modells vor.',
    },
    lora: {
      by: 'Hu und andere, 2021',
      summary: 'Um ein Modell anzupassen, lässt man alle seine Gewichte unberührt und trainiert daneben einen kleinen Zusatz. Das braucht nur einen Bruchteil des Speichers, und der Zusatz ist eine kleine Datei, die sich austauschen lässt.',
    },
    rt2: {
      by: 'Brohan und andere, 2023',
      summary: 'Ein Modell, das Bilder und Text versteht, wird darauf trainiert, Roboterbewegungen als Tokens zu schreiben. Der Roboter kann dann Anweisungen zu Gegenständen befolgen, die in seinem Robotertraining nie vorkamen.',
    },
    graphcast: {
      by: 'Lam und andere, 2022; in Science 2023',
      summary: 'Ein Netz, trainiert mit Wetteraufzeichnungen aus vierzig Jahren, erstellt in weniger als einer Minute eine Zehn-Tage-Vorhersage für den ganzen Globus und übertrifft das führende herkömmliche System bei den meisten geprüften Messgrößen.',
    },
    alphafold: {
      by: 'Jumper und andere, 2021',
      summary: 'Beschreibt AlphaFold 2, das die dreidimensionale Form eines Proteins aus der Abfolge seiner Bausteine vorhersagt, in vielen Fällen so genau wie ein Experiment.',
    },
    mcculloch: {
      by: 'McCulloch und Pitts, 1943',
      summary: 'Beschreibt eine Nervenzelle als einfachen Schalter: Sie feuert oder sie feuert nicht, je nachdem, welche Signale bei ihr ankommen. Die Autoren zeigen, dass Netze aus solchen Zellen die Operationen der Logik ausführen können. Lernen können diese Zellen noch nicht, aber aus diesem Bild sind die künstlichen neuronalen Netze hervorgegangen.',
    },
    shannon: {
      by: 'Shannon, 1948',
      summary: 'Die Gründungsarbeit der Informationstheorie: Sie misst Information in Bits und zeigt, wie viel davon eine gestörte Leitung übertragen kann. Nebenbei erzeugt Shannon Text, der wie Englisch aussieht, indem er jeden Buchstaben oder jedes Wort danach auswählt, wie oft sie auf die vorangehenden folgen. Das ist ein Sprachmodell im Kleinen.',
    },
    turing: {
      by: 'Turing, 1950',
      summary: 'Turing ersetzt die Frage „Können Maschinen denken?“ durch ein Spiel: Ein Fragesteller tauscht schriftliche Nachrichten mit einem Menschen und einer Maschine aus und muss herausfinden, wer wer ist. Danach beantwortet er der Reihe nach neun Einwände, darunter den von Ada Lovelace, und schließt mit Ideen für eine Maschine, die lernt wie ein Kind.',
    },
    dartmouth: {
      by: 'McCarthy, Minsky, Rochester und Shannon, 1955',
      summary: 'Ein Förderantrag für einen Sommer-Workshop im Jahr 1956: zehn Forscher, zwei Monate. Er geht von der Vermutung aus, dass sich jeder Aspekt des Lernens und der Intelligenz so genau beschreiben lässt, dass eine Maschine ihn nachbilden kann. Aus diesem Antrag stammt der Begriff „künstliche Intelligenz“.',
    },
    perceptron: {
      by: 'Rosenblatt, 1958',
      summary: 'Die Theorie eines Psychologen darüber, wie ein Gehirn speichern könnte, was es wahrnimmt: nicht als abgelegte Bilder, sondern in der Stärke der Verbindungen zwischen seinen Zellen. Das darauf aufbauende Perzeptron lernt aus Beispielen, Muster zu unterscheiden, indem seine Verbindungen stärker oder schwächer werden.',
    },
    wiener: {
      by: 'Wiener, 1960',
      summary: 'Wiener legt dar, dass lernende Maschinen Strategien entwickeln können, die ihre Erbauer nicht vorhergesehen haben, und dass sie schneller handeln, als Menschen eingreifen können. Wenn wir eine laufende Maschine nicht mehr aufhalten können, schreibt er, sollten wir ganz sicher sein, dass der Zweck, den wir ihr gegeben haben, wirklich der ist, den wir wollen.',
    },
    good: {
      by: 'Good, 1965',
      summary: 'Definiert eine „ultraintelligente Maschine“ als eine, die den Menschen in jeder geistigen Tätigkeit weit übertrifft. Weil das Entwerfen von Maschinen zu diesen Tätigkeiten gehört, könnte sie noch bessere Maschinen entwerfen, und Good erwartet eine „Intelligenzexplosion“. Der viel zitierte Satz von der letzten Erfindung steht hier.',
    },
    eliza: {
      by: 'Weizenbaum, 1966',
      summary: 'Weizenbaum erklärt, wie sein Programm ein Gespräch führt: Es sucht in der Eingabe des Nutzers nach Schlüsselwörtern und stellt den Satz nach festen Regeln um. Sein bekanntestes Skript ahmt einen Psychotherapeuten nach. Den Mechanismus legt er mit Absicht offen, damit der Eindruck des Verstehens verschwindet.',
    },
    searle: {
      by: 'Searle, 1980',
      summary: 'Führt das Chinesische Zimmer ein: Ein Mensch, der Regeln für chinesische Schriftzeichen befolgt, gibt die richtigen Antworten, ohne ein Wort zu verstehen. Searle schließt daraus, dass das Ausführen eines Programms für sich allein nie zum Verstehen genügt. Die Zeitschrift druckte die Arbeit zusammen mit Erwiderungen vieler anderer Forscher und seinen Antworten darauf.',
    },
    backprop: {
      by: 'Rumelhart, Hinton und Williams, 1986',
      summary: 'Beschreibt ein Verfahren, das die Gewichte eines Netzes immer wieder verstellt, sodass seine Ausgabe der gewünschten näher kommt. Dabei bilden die inneren Schichten, denen niemand direkt etwas vorgibt, von selbst nützliche Merkmale der Aufgabe ab. Gefunden hatten das Verfahren schon andere; diese Arbeit machte es bekannt.',
    },
    hawking: {
      by: 'Rory Cellan-Jones, BBC News, 2014',
      summary: 'Nach seinem neuen Sprachsystem gefragt, das mit einer einfachen Form von KI seine nächsten Wörter vorschlägt, sagt Hawking, solche Werkzeuge hätten sich als sehr nützlich erwiesen. Eine Maschine aber, die dem Menschen ebenbürtig oder überlegen wäre, würde sich immer schneller selbst neu entwerfen, und der Mensch, begrenzt durch die langsame biologische Evolution, könnte nicht mithalten.',
    },
    alphago: {
      by: 'Silver und andere, 2016',
      summary: 'Beschreibt AlphaGo: Ein neuronales Netz schlägt Züge vor, ein zweites bewertet Stellungen, und eine Suche verbindet beides. Gelernt haben die Netze aus Partien menschlicher Meister und aus Partien, die das Programm gegen sich selbst spielte. Die Arbeit berichtet von einem 5:0 gegen den Europameister; das Match gegen Lee Sedol folgte im März 2016.',
    },
    gnmt: {
      by: 'Wu und andere, 2016',
      summary: 'Beschreibt das neuronale Netz hinter dem erneuerten Google Translate. Es liest einen Satz und schreibt mithilfe von Attention die Übersetzung, und seltene Wörter zerlegt es in Teilstücke. Bei einfachen Sätzen, die Menschen beurteilten, machte es etwa 60 Prozent weniger Fehler als das Vorgängersystem, das Satzteile aneinanderreihte.',
    },
    bitterLesson: {
      by: 'Sutton, 2019',
      summary: 'Ein kurzer Essay über siebzig Jahre KI-Forschung. Im Schach, im Go, bei der Spracherkennung und beim maschinellen Sehen halfen Methoden, die auf menschlichem Fachwissen aufbauten, zunächst weiter und wurden dann von allgemeinen Methoden überholt, von Suchen und Lernen, die mit der Rechenleistung wachsen. Sutton nennt das die bittere Lektion.',
    },
    parrots: {
      by: 'Bender, Gebru und andere, 2021',
      summary: 'Fragt, ob Sprachmodelle zu groß werden können. Die Arbeit zählt die Kosten immer größerer Modelle auf: ihren Energieverbrauch, Trainingstexte, die zu umfangreich sind, um sie zu prüfen, und die Vorurteile enthalten, und Leser, die flüssigen Text für Verstehen halten. Ein solches Modell nennt sie einen „stochastischen Papagei“, der Wortfolgen nach Wahrscheinlichkeit zusammenflickt, ohne Bezug zur Bedeutung.',
    },
    mcp: {
      by: 'Anthropic, 2024',
      summary: 'Die Ankündigung von Anthropic vom 25. November 2024. Bis dahin brauchte jede Datenquelle ihre eigene, eigens gebaute Anbindung an ein KI-System; MCP ersetzt diese durch ein einziges offenes Protokoll. Die Spezifikation, Entwicklerwerkzeuge und eine Sammlung fertiger Server wurden am selben Tag als Open Source veröffentlicht.',
    },
    geminiEnergy: {
      by: 'Elsworth und andere, 2025',
      summary: 'Google misst Energie, Emissionen und Wasser, die das Beantworten von Prompts in den eigenen Rechenzentren verbraucht, und rechnet dabei nicht nur die KI-Chips ein, sondern auch die Rechner um sie herum, ungenutzte Reserve und den Betrieb des Rechenzentrums. Der mittlere Text-Prompt an Gemini kommt auf 0,24 Wattstunden, weniger als neun Sekunden Fernsehen. Es ist eine Messung des Unternehmens selbst, und sie erfasst das Beantworten von Prompts, nicht das Training.',
    },
    gentleSingularity: {
      by: 'Altman, 2025',
      summary: 'Ein Essay des OpenAI-Chefs über die kommenden Jahre. In einer Bemerkung in Klammern sagt er, eine durchschnittliche ChatGPT-Anfrage verbrauche etwa 0,34 Wattstunden, ungefähr so viel wie eine sparsame Glühbirne in ein paar Minuten. Wie die Zahl gemessen wurde, sagt der Essay nicht.',
    },
  },
};
