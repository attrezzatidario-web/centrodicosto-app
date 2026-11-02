/* Centro di Costo — settori di attività (v95).
   Ogni gestionale ha un settore: decide i nomi delle sedi, le sezioni (moduli) accese di partenza
   e le categorie di spesa con le parole chiave per la classificazione automatica.
   Il settore «veicoli» è quello di Soluzione Veicolare: usa le regole già presenti in app.js. */
(() => {
  'use strict';
  // blocchi di categorie comuni a più settori (l'ordine conta: vince la prima regola che trova una parola)
  const C = {
    pulizia: ['Pulizia e igiene', ['DETERG', 'SGRASS', 'IGIENIZZ', 'SANIFIC', 'DISINFETT', 'CARTA MANI', 'CARTA IGIENICA', 'ROTOLONI', 'SAPONE', 'SACCHI', 'SACCO NERO', 'SPUGN', 'PANNO', 'PANNI ', 'MOCIO', 'CANDEGGINA', 'ANTICALCARE', 'BRILLANTANTE', 'SCOPA', 'GUANTI MONOUSO', 'GUANTI NITRILE', 'GUANTI IN NITRILE']],
    utenze: ['Utenze', ['ENEL', 'ENERGIA ELETTRICA', 'BOLLETTA', 'LUCE ', 'FORNITURA GAS', 'GAS METANO', 'METANO', 'FORNITURA ACQUA', 'SERVIZIO IDRICO', 'ACEA', 'HERA ', 'A2A', 'IREN', 'EDISON', 'ENI PLENITUDE', 'TELEFON', 'TIM ', 'VODAFONE', 'WINDTRE', 'FASTWEB', 'ILIAD', 'INTERNET', 'FIBRA']],
    affitto: ['Affitto e locazioni', ['AFFITTO', 'CANONE DI LOCAZIONE', 'LOCAZIONE', 'CONDOMINIO', 'SPESE CONDOMINIALI']],
    personale: ['Personale e consulenze', ['COMMERCIALISTA', 'CONSULEN', 'BUSTE PAGA', 'ELABORAZIONE PAGHE', 'PAGHE', 'AVVOCATO', 'NOTAIO', 'HACCP', 'CORSO ', 'FORMAZIONE', 'MEDICO COMPETENTE', 'SICUREZZA SUL LAVORO', 'RSPP']],
    manut: ['Manutenzione e riparazioni', ['MANUTENZIONE', 'RIPARAZIONE', 'ASSISTENZA TECNICA', 'INTERVENTO TECNICO', 'INTERVENTO', 'IDRAULICO', 'ELETTRICISTA', 'TECNICO', 'RICAMBIO', 'RICAMBI']],
    ufficio: ['Ufficio, cassa e informatica', ['RISMA', 'CARTA A4', 'TONER', 'CARTUCCIA', 'STAMPANTE', 'REGISTRATORE DI CASSA', 'REGISTRATORE TELEMATICO', ' POS ', 'ROTOLI CASSA', 'ROTOLI TERMICI', 'SOFTWARE', 'GESTIONALE', 'ABBONAMENTO APP', 'NOTEBOOK', 'COMPUTER', 'TABLET', 'MONITOR', 'CANCELLERIA', 'PENNE']],
    marketing: ['Marketing e pubblicità', ['VOLANTIN', 'PUBBLICIT', 'INSEGNA', 'SOCIAL', 'SPONSOR', 'BIGLIETTI DA VISITA', 'GOOGLE ADS', 'META ADS', 'SITO WEB', 'MENU STAMPAT']],
    trasporti: ['Trasporti e consegne', ['SPESE DI TRASPORTO', 'TRASPORTO', 'SPEDIZIONE', 'CORRIERE', 'CONSEGNA']],
    assic: ['Assicurazioni e tasse', ['ASSICURAZ', 'POLIZZA', 'TARI', 'IMU', 'TASSA', 'SIAE', 'CANONE RAI', 'DIRITTI CAMERALI', 'BOLLO']],
    delivery: ['Commissioni delivery e prenotazioni', ['DELIVEROO', 'JUST EAT', 'JUSTEAT', 'GLOVO', 'UBER EATS', 'THEFORK', 'COMMISSION']],
    dpi: ['DPI e sicurezza', ['SCARPE', 'SCARPA', 'GUANT', 'OCCHIAL', 'ELMETT', 'CASCO', 'IMBRAC', 'GILET ALTA', 'ALTA VISIBILIT', 'CARTELL', 'ESTINTOR', 'PRONTO SOCCORSO', 'MASCHERIN', 'CUFFIE ANTIRUMORE', 'TAPPI']],
    ferramenta: ['Ferramenta e utensili', ['VITI', 'VITE ', 'TASSELL', 'CHIODI', 'BULLON', 'UTENSIL', 'CARRIOLA', 'CAZZUOLA', 'FRATTAZZ', 'LIVELLA', 'FLESSOMETRO', 'METRO ', 'TRAPANO', 'AVVITATORE', 'SMERIGLIATRICE', 'FLESSIBILE', 'DISCO', 'DISCHI', 'PUNTE', 'MARTELL', 'PINZA', 'SECCHI', 'BADIL', 'PALA ']],
    mezzi: ['Mezzi e carburante', ['GASOLIO', 'CARBURANTE', 'BENZINA', 'MULETTO', 'CAMION', 'FURGONE', 'PNEUMATIC', 'GOMME', 'TAGLIANDO', 'REVISIONE', 'AUTOSTRADA', 'TELEPASS', 'NOLEGGIO FURGONE']]
  };
  const tail = [C.utenze, C.affitto, C.personale, C.manut, C.marketing, C.assic];

  const L = [
    { id: 'veicoli', n: 'Allestimento veicoli e attrezzature', s: 'Veicoli e attrezzature', d: 'Officine, allestimenti, ricambi, abbigliamento da lavoro, spedizioni e mezzi',
      ic: '<path d="M2 7h11v9H2zM13 10h4l3 3v3h-7z"/><circle cx="6" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/>',
      sede: ['Piazzale', 'Piazzali'], acq: 'Acquisti',
      mod: { piazzali: true, gls: true, gasolio: true, lyreco: true, amazon: true, torental: true, incassi: true, clienti: true, fornitori: true, magazzino: true, vendite: true }, cat: null },

    { id: 'bar', n: 'Bar e caffetteria', s: 'Bar', d: 'Bar, caffetterie, pasticcerie e gelaterie',
      ic: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16M8 3v3M11 3v3M14 3v3"/>',
      sede: ['Locale', 'Locali'], acq: 'Acquisti', ivaInc: 10,
      mod: { piazzali: true, gls: false, gasolio: false, lyreco: false, amazon: false, incassi: true, clienti: true, fornitori: true, magazzino: false, vendite: false },
      cat: [
        ['Caffè e bevande calde', ['CAFFE', 'CAFFÈ', 'ESPRESSO', 'MISCELA', 'DECAFFEINATO', 'ORZO', 'GINSENG', 'CIOCCOLATA', 'CAMOMILLA', ' TÈ ', ' TE ', ' THE ', 'TISANA', 'INFUSO', 'CAPSULE', 'CIALDE']],
        ['Bevande e alcolici', ['ACQUA MINERALE', 'ACQUA NATURALE', 'ACQUA FRIZZANTE', 'ACQUA LISCIA', 'BIBIT', 'COCA', 'ARANCIATA', 'CHINOTTO', 'SUCCO', 'SUCCHI', 'BIRRA', 'VINO', 'PROSECCO', 'SPUMANTE', 'APEROL', 'CAMPARI', 'SPRITZ', 'GIN ', 'VODKA', 'RUM ', 'WHISKY', 'AMARO', 'LIQUOR', 'SCIROPP', 'TONICA', 'ENERGY', 'LATTINE']],
        ['Latte e latticini', ['LATTE', 'PANNA', 'YOGURT', 'BURRO', 'FORMAGG', 'MOZZARELLA']],
        ['Food e pasticceria', ['CORNETT', 'BRIOCHE', 'CROISSANT', 'PASTICC', 'TRAMEZZIN', 'PANIN', 'PANE ', 'FOCACC', 'PIZZETT', 'TOAST', 'PROSCIUTTO', 'SALUM', 'TORTA', 'BISCOTT', 'GELAT', 'ZUCCHERO', 'DOLC', 'SNACK', 'PATATINE', 'FRUTTA', 'LIMONI', 'ARANCE', 'CIOCCOLAT']],
        ['Monouso e packaging', ['BICCHIER', 'CANNUCC', 'TOVAGLIOL', 'PALETTIN', 'BUSTIN', 'VASCHETT', 'ASPORTO', 'COPERCH', 'SHOPPER', 'MONOUSO', 'VASSOI']],
        C.pulizia,
        ['Attrezzature e arredi', ['MACCHINA', 'MACINA', 'FRIGO', 'VETRINA', 'LAVASTOVIGLIE', 'LAVABICCHIERI', 'TAZZIN', 'BICCHIERI VETRO', 'ARREDO', 'TAVOL', 'SEDIE', 'SGABELL', 'OMBRELLON']],
        C.delivery, C.ufficio, ...tail]
    },

    { id: 'pizzeria', n: 'Pizzeria', s: 'Pizzeria', d: 'Pizzerie al taglio, da asporto e con servizio al tavolo',
      ic: '<path d="M12 3 3.5 18.5a17 17 0 0 0 17 0z"/><path d="M6 13.5a14 14 0 0 0 12 0"/><circle cx="11" cy="9.5" r="1"/><circle cx="13.5" cy="15" r="1"/><circle cx="9.5" cy="15.5" r="1"/>',
      sede: ['Locale', 'Locali'], acq: 'Acquisti', ivaInc: 10,
      mod: { piazzali: true, gls: false, gasolio: false, lyreco: false, amazon: false, incassi: true, clienti: true, fornitori: true, magazzino: false, vendite: false },
      cat: [
        ['Farine e impasti', ['FARINA', 'SEMOLA', 'LIEVITO', 'MANITOBA', 'CAPUTO', 'MOLINO', 'MALTO', 'BIGA', 'IMPASTO']],
        ['Latticini e formaggi', ['MOZZARELLA', 'FIOR DI LATTE', 'FIORDILATTE', 'BUFALA', 'PROVOLA', 'RICOTTA', 'PARMIGIANO', 'GRANA', 'GORGONZOLA', 'STRACCHINO', 'BURRATA', 'STRACCIATELLA', 'PECORINO', 'SCAMORZA', 'FORMAGG', 'LATTE', 'PANNA', 'BURRO']],
        ['Salumi e carni', ['PROSCIUTTO', 'SALAME', 'SALAMINO', 'SPIANATA', 'NDUJA', "'NDUJA", 'SALSICCIA', 'SPECK', 'MORTADELLA', 'PANCETTA', 'GUANCIALE', 'WURSTEL', 'BRESAOLA', 'POLLO', 'CARNE', 'PORCHETTA']],
        ['Ortofrutta', ['POMODORINI', 'DATTERINI', 'CILIEGINI', 'ZUCCHIN', 'MELANZAN', 'PEPERON', 'RUCOLA', 'BASILICO', 'CIPOLL', 'PATATE', 'INSALATA', 'FRUTTA', 'LIMONI', 'AGLIO', 'FRIARIELLI', 'SPINACI', 'FUNGHI FRESCHI']],
        ['Pomodoro e conserve', ['POMODOR', 'PELATI', 'PASSATA', 'POLPA', 'CONCENTRATO', 'OLIVE', 'CAPPERI', 'ACCIUGHE', 'ALICI', 'TONNO', 'CARCIOF', 'FUNGHI', 'SOTTOLIO']],
        ['Olio e dispensa', ['OLIO', 'EXTRAVERGINE', 'ORIGANO', 'SPEZIE', 'PEPE', 'ZUCCHERO', 'ACETO', ' SALE ', 'SALE FINO', 'SALE GROSSO']],
        ['Bevande', ['ACQUA MINERALE', 'ACQUA NATURALE', 'ACQUA FRIZZANTE', 'BIBIT', 'COCA', 'ARANCIATA', 'BIRRA', 'VINO', 'LATTINE', 'CAFFE', 'CAFFÈ', 'AMARO', 'LIMONCELLO']],
        ['Cartoni e asporto', ['CARTONI', 'CARTONE PIZZA', 'SCATOLE PIZZA', 'VASSOI', 'ASPORTO', 'SHOPPER', 'TOVAGLIOL', 'CARTA FORNO', 'MONOUSO', 'PIATTI', 'POSATE', 'BICCHIER']],
        ['Forno e combustibili', ['LEGNA', 'PELLET', 'CARBONELLA', 'GPL', 'BOMBOL', 'FORNO']],
        C.pulizia,
        ['Attrezzature', ['IMPASTATRICE', 'SPEZZATRICE', 'PALA ', 'PALETTA', 'TAGLIAPIZZA', 'FRIGO', 'BANCO', 'FRIGGITRICE', 'AFFETTATRICE', 'BILANCIA', 'CASSETTE LIEVITAZIONE', 'TEGLI']],
        C.delivery, C.ufficio, ...tail]
    },

    { id: 'ristorante', n: 'Ristorante', s: 'Ristorante', d: 'Ristoranti, trattorie, osterie e agriturismi',
      ic: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 1-3 3.5-3 6v3h3v9"/>',
      sede: ['Locale', 'Locali'], acq: 'Acquisti', ivaInc: 10,
      mod: { piazzali: true, gls: false, gasolio: false, lyreco: false, amazon: false, incassi: true, clienti: true, fornitori: true, magazzino: true, vendite: false },
      cat: [
        ['Carne', ['MANZO', 'VITELLO', 'MAIALE', 'POLLO', 'TACCHINO', 'AGNELLO', 'ABBACCHIO', 'FILETTO', 'BISTECCA', 'TAGLIATA', 'MACINATO', 'SALSICCIA', 'COSTAT', 'CARNE', 'GUANCIALE', 'PANCETTA', 'PROSCIUTTO', 'SALUM']],
        ['Pesce', ['PESCE', 'SALMONE', 'TONNO', 'GAMBER', 'SCAMPI', 'COZZE', 'VONGOLE', 'CALAMAR', 'POLPO', 'TOTANI', 'ORATA', 'BRANZINO', 'SPIGOLA', 'BACCAL', 'ALICI', 'SEPPI', 'CROSTACE', 'ASTICE']],
        ['Ortofrutta', ['VERDUR', 'INSALATA', 'POMODORI ', 'POMODORINI', 'ZUCCHIN', 'MELANZAN', 'PEPERON', 'PATATE', 'CIPOLL', 'AGLIO', 'FRUTTA', 'LIMONI', 'ARANCE', 'FRAGOL', 'FUNGHI', 'BASILICO', 'PREZZEMOLO', 'ROSMARINO', 'CARCIOF', 'CARCIOFI', 'ASPARAGI']],
        ['Latticini e uova', ['LATTE', 'PANNA', 'BURRO', 'MOZZARELLA', 'BUFALA', 'PARMIGIANO', 'GRANA', 'PECORINO', 'RICOTTA', 'FORMAGG', 'UOVA', 'YOGURT', 'BURRATA']],
        ['Vini e bevande', ['VINO', 'VINI', 'PROSECCO', 'CHAMPAGNE', 'SPUMANTE', 'FRANCIACORTA', 'BIRRA', 'ACQUA MINERALE', 'ACQUA NATURALE', 'ACQUA FRIZZANTE', 'BIBIT', 'COCA', 'AMARO', 'GRAPPA', 'LIQUOR', 'CAFFE', 'CAFFÈ']],
        ['Dispensa', ['PASTA', 'SPAGHETTI', 'RISO', 'FARINA', 'OLIO', 'EXTRAVERGINE', 'ACETO', ' SALE ', 'ZUCCHERO', 'LEGUMI', 'PELATI', 'PASSATA', 'CONSERVE', 'SPEZIE', 'PANE', 'GRISSINI', 'CIOCCOLAT']],
        ['Monouso e asporto', ['MONOUSO', 'TOVAGLIOLI DI CARTA', 'TOVAGLIOLI CARTA', 'VASCHETT', 'ASPORTO', 'SHOPPER', 'PELLICOLA', 'ALLUMINIO', 'CARTA FORNO', 'SACCHETTI SOTTOVUOTO']],
        ['Tovagliato e lavanderia', ['LAVANDERIA', 'NOLEGGIO TOVAGL', 'TOVAGLI', 'DIVISE', 'GREMBIUL', 'GIACCHE CUOCO']],
        C.pulizia,
        ['Attrezzature e arredi', ['ABBATTITORE', 'FRIGO', 'FORNO', 'PIASTRA', 'FRIGGITRICE', 'LAVASTOVIGLIE', 'PENTOL', 'PADELL', 'COLTELL', 'PIATTI', 'BICCHIERI', 'POSATE', 'TAVOL', 'SEDIE', 'ARREDO', 'SOTTOVUOTO']],
        C.delivery, C.ufficio, ...tail]
    },

    { id: 'lavanderia', n: 'Lavanderia', s: 'Lavanderia', d: 'Lavanderie, tintorie, lavasecco e self-service',
      ic: '<rect x="4" y="3" width="16" height="18" rx="2.5"/><circle cx="12" cy="13" r="4.5"/><path d="M7.5 6.5h.01M10.5 6.5h3"/>',
      sede: ['Punto vendita', 'Punti vendita'], acq: 'Acquisti',
      mod: { piazzali: true, gls: false, gasolio: true, lyreco: false, amazon: false, incassi: true, clienti: true, fornitori: true, magazzino: false, vendite: true },
      cat: [
        ['Detersivi e prodotti chimici', ['DETERS', 'AMMORBID', 'SMACCHIA', 'CANDEGG', 'PERCLOR', 'SOLVENTE', 'IGIENIZZ', 'ADDITIV', 'ENZIM', 'SAPONE', 'ANTICALCARE', 'PROFUM', 'APPRETTO', 'NEUTRALIZZ', 'SBIANCANTE', 'DETERGENTE']],
        ['Grucce e imballi', ['GRUCC', 'APPENDIABIT', 'BUSTE', 'CELLOPHANE', 'FILM', 'COPRIABITI', 'CARTELLIN', 'ETICHETT', 'SACCHI', 'SCATOL', 'SPILLI', 'CARTONCIN']],
        ['Macchinari e ricambi', ['LAVATRICE', 'LAVATRICI', 'ESSICCAT', 'ASCIUGATRICE', 'MANGANO', 'STIRO', 'FERRO DA STIRO', 'CALDAIA', 'GENERATORE DI VAPORE', 'MANICHINO', 'SMACCHIATRICE', 'RICAMBI', 'GUARNIZ', 'CINGHIA', 'RESISTENZA', 'POMPA', 'GETTONIERA']],
        C.utenze, C.trasporti, C.mezzi,
        ['Pulizia del locale', ['SCOPA', 'MOCIO', 'PANNO', 'CARTA MANI', 'CARTA IGIENICA', 'SACCO NERO']],
        C.ufficio, C.affitto, C.personale, C.manut, C.marketing, C.assic]
    },

    { id: 'edile', n: 'Ingrosso edile (smorzo)', s: 'Ingrosso edile', d: 'Rivendite e depositi di materiali da costruzione',
      ic: '<path d="M3 21V10l9-6 9 6v11"/><path d="M7 21v-5h4v5M13 13h4v3h-4zM3 21h18"/>',
      sede: ['Deposito', 'Depositi'], acq: 'Acquisti',
      mod: { piazzali: true, gls: false, gasolio: true, lyreco: false, amazon: false, incassi: true, clienti: true, fornitori: true, magazzino: true, vendite: true },
      cat: [
        ['Cementi, malte e premiscelati', ['CEMENTO', 'MALTA', 'CALCE', 'GESSO', 'INTONAC', 'MASSETTO', 'RASANTE', 'COLLA PER PIASTRELLE', 'COLLA PIASTRELLE', 'ADESIVO CEMENTIZIO', 'STUCCO', 'PREMISCEL', 'BETON', 'AUTOLIVELLANTE']],
        ['Laterizi e blocchi', ['MATTON', 'FORATO', 'FORATI', 'BLOCCO', 'BLOCCHI', 'LATERIZ', 'TEGOL', 'COPPI', 'COPPO', 'PIGNATT', 'POROTON', 'GASBETON', 'YTONG', 'CORDOLO']],
        ['Ferro e acciaio', ['FERRO', 'TONDINO', 'RETE ELETTROSALD', 'ELETTROSALDATA', 'BARRE', 'ACCIAIO', 'TRALICCIO', 'STAFFE']],
        ['Inerti', ['SABBIA', 'GHIAIA', 'BRECCIA', 'PIETRISCO', 'STABILIZZATO', 'POZZOLANA', 'MISTO CAVA', 'GRANIGLIA']],
        ['Isolanti e cartongesso', ['CARTONGESSO', 'LASTRA', 'LASTRE', 'PROFIL', 'ISOLANT', 'POLISTIRENE', ' EPS', ' XPS', 'LANA DI ROCCIA', 'LANA DI VETRO', 'GUAINA', 'IMPERMEAB', 'CAPPOTTO', 'MEMBRANA']],
        ['Ceramiche e arredobagno', ['PIASTRELL', 'GRES', 'PAVIMENT', 'RIVESTIM', 'PARQUET', 'LAMINATO', 'BATTISCOPA', 'SANITARI', 'LAVABO', ' WC', 'PIATTO DOCCIA', 'RUBINETT', 'MISCELATORE', 'BOX DOCCIA']],
        ['Idraulica e scarichi', ['TUBO', 'TUBI', 'PVC', 'RACCORD', 'POZZETT', 'SCARICO', 'FOGNA', 'MULTISTRATO', 'VALVOL', 'COLLETTOR', 'CHIUSINO', 'CANALETTA', 'GRONDA', 'PLUVIAL']],
        ['Vernici e prodotti chimici', ['VERNIC', 'PITTUR', 'IDROPITTURA', 'SMALTO', 'PRIMER', 'FISSATIVO', 'SILICONE', 'SCHIUMA', 'SIGILLANT', 'ADDITIVO', 'IMPREGNANTE', 'DISARMANTE']],
        C.ferramenta,
        ['Pallet e trasporti', ['PALLET', 'BANCALI', 'BANCALE', 'TRASPORTO', 'NOLO', 'AUTOGRU', 'CONSEGNA', 'SPEDIZIONE']],
        C.mezzi, C.dpi, C.ufficio, ...tail]
    },

    { id: 'impresa', n: 'Impresa edile', s: 'Impresa edile', d: 'Costruzioni, ristrutturazioni, impiantisti e artigiani',
      ic: '<path d="M4 18h16M6 18v-5a6 6 0 0 1 12 0v5M12 7V4M9.5 7.5 8 5M14.5 7.5 16 5"/><path d="M3 21h18"/>',
      sede: ['Cantiere', 'Cantieri'], acq: 'Acquisti',
      mod: { piazzali: true, gls: false, gasolio: true, lyreco: false, amazon: false, incassi: true, clienti: true, fornitori: true, magazzino: true, vendite: false },
      cat: [
        ['Subappalti e manodopera', ['SUBAPPALT', 'MANODOPERA', 'LAVORAZIONE', 'LAVORAZIONI', 'POSA IN OPERA', 'PRESTAZIONE', ' SAL ', 'STATO AVANZAMENTO']],
        ['Noleggi mezzi e attrezzature', ['NOLEGGIO', 'NOLO', 'ESCAVATORE', 'MINIESCAVATORE', 'PONTEGGI', 'AUTOGRU', 'GRU ', 'PIATTAFORMA', 'BETONIERA', 'BAGNO CHIMICO', 'MARTELLO DEMOLITORE']],
        ['Smaltimento rifiuti', ['SMALTIMENTO', 'DISCARICA', 'CASSONE', 'CASSONI', 'RIFIUTI', 'MACERIE', 'FORMULARIO', 'CONFERIMENTO']],
        ['Progettazione e pratiche', ['GEOMETRA', 'INGEGNER', 'ARCHITETT', 'PROGETT', 'PRATICA', 'PERMESSO', ' SCIA', ' CILA', 'COLLAUDO', 'DIREZIONE LAVORI', 'CATAST', 'PERIZIA', 'APE ']],
        ['Impianti', ['CAVO', 'CAVI', 'CORRUGAT', 'QUADRO ELETTRICO', 'INTERRUTT', 'PRESA', 'PRESE', 'CALDAIA', 'CLIMATIZZ', 'POMPA DI CALORE', 'RADIATOR', 'TERMOSIFON', 'MULTISTRATO', 'RACCORD', 'SANITARI', 'RUBINETT']],
        ['Materiali edili', ['CEMENTO', 'MALTA', 'CALCE', 'MATTON', 'BLOCCO', 'BLOCCHI', 'FORATI', 'SABBIA', 'GHIAIA', 'FERRO', 'RETE ELETTROSALD', 'CARTONGESSO', 'ISOLANT', 'PIASTRELL', 'GRES', 'TEGOL', 'GUAINA', 'INTONAC', 'MASSETTO', 'COLLA', 'TUBO', 'TUBI', 'PVC', 'VERNIC', 'PITTUR', 'LEGNAME', 'TAVOLE']],
        C.dpi, C.ferramenta, C.mezzi, C.ufficio, ...tail]
    },

    { id: 'negozio', n: 'Negozio e commercio', s: 'Negozio', d: 'Negozi, botteghe, minimarket e commercio al dettaglio',
      ic: '<path d="M4 9h16l-1 11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z"/><path d="M8.5 9V7a3.5 3.5 0 0 1 7 0v2"/>',
      sede: ['Punto vendita', 'Punti vendita'], acq: 'Acquisti',
      mod: { piazzali: true, gls: true, gasolio: false, lyreco: false, amazon: true, incassi: true, clienti: true, fornitori: true, magazzino: true, vendite: false },
      cat: [
        ['Spedizioni e-commerce', ['CORRIERE', 'SPEDIZ', ' GLS', ' BRT', 'BARTOLINI', ' SDA', ' DHL', ' UPS ', 'POSTE ITALIANE', 'POSTE']],
        ['Imballi e shopper', ['SHOPPER', 'BUSTE', 'SACCHETT', 'CARTA REGALO', 'CARTA DA PACCHI', 'NASTRO', 'SCATOL', 'ETICHETT', 'CARTELLIN', 'IMBALL', 'PLURIBALL']],
        ['Allestimento e arredo', ['SCAFFAL', 'VETRIN', 'MANICHIN', 'ESPOSITOR', 'ARREDO', 'BANCONE', 'ILLUMINAZ', 'FARETT', ' LED', 'SPECCHIO', 'CAMERINO']],
        C.ufficio, C.marketing, C.pulizia,
        ['Merce per la rivendita', ['MERCE', 'ARTICOLI', 'RIASSORTIMENTO', 'COLLEZIONE', 'LOTTO', 'STOCK', 'CAMPIONARIO', 'PRODOTTI']],
        C.utenze, C.affitto, C.personale, C.manut, C.trasporti, C.assic]
    },

    { id: 'estetica', n: 'Parrucchiere ed estetica', s: 'Parrucchiere ed estetica', d: 'Parrucchieri, barbieri, centri estetici e nail bar',
      ic: '<circle cx="6.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="17.5" r="2.5"/><path d="M8.6 8 20 18M8.6 16 20 6"/>',
      sede: ['Salone', 'Saloni'], acq: 'Acquisti',
      mod: { piazzali: true, gls: false, gasolio: false, lyreco: false, amazon: true, incassi: true, clienti: true, fornitori: true, magazzino: true, vendite: false },
      cat: [
        ['Prodotti per la rivendita', ['RIVENDITA', 'KIT VENDITA', 'LINEA RETAIL', 'RETAIL']],
        ['Prodotti professionali', ['TINTA', 'TINTE', 'COLORE', 'OSSIGENO', 'DECOLOR', 'SHAMPOO', 'BALSAMO', 'MASCHERA', 'TRATTAMENT', 'PERMANENTE', 'CHERATIN', 'CERA', 'SMALTO', 'SEMIPERMANENTE', ' GEL', 'CREMA', 'OLIO', 'SIERO', 'LOZIONE', 'FIALE', 'LACCA', 'SPUMA']],
        ['Monouso e consumabili', ['ASCIUGAMANI MONOUSO', 'CARTA LETTINO', 'LENZUOLIN', 'GUANTI', 'MANTELLIN', 'STAGNOLA', 'CARTINE', 'CUFFIE', 'SPATOL', 'COTONE', 'DISCHETTI', 'LIME', 'MONOUSO']],
        ['Attrezzature e arredi', ['PHON', 'ASCIUGACAPELLI', 'PIASTRA', 'ARRICCIA', 'POLTRONA', 'LAVATESTA', 'LETTINO', 'FORBIC', 'PETTIN', 'SPAZZOL', 'RASOIO', 'TOSATRICE', 'SCALDACERA', 'LAMPADA UV', 'LAMPADA LED', 'CASCO', 'CARRELLO', 'SPECCHI']],
        ['Biancheria e lavanderia', ['ASCIUGAMANI', 'ACCAPPATOI', 'LAVANDERIA', ' TELI', 'KIMONO']],
        C.pulizia,
        ['Prenotazioni e app', ['TREATWELL', 'UALA', 'PRENOTAZION', 'ABBONAMENTO APP']],
        C.ufficio, ...tail]
    },

    { id: 'hotel', n: 'Hotel e B&B', s: 'Hotel e B&B', d: 'Hotel, B&B, case vacanza e affittacamere',
      ic: '<path d="M3 20V6M3 16h18v4M21 16v-4a3 3 0 0 0-3-3h-7v7"/><circle cx="7" cy="11.5" r="2"/>',
      sede: ['Struttura', 'Strutture', 'f'], acq: 'Acquisti', ivaInc: 10,
      mod: { piazzali: true, gls: false, gasolio: false, lyreco: false, amazon: true, incassi: true, clienti: true, fornitori: true, magazzino: true, vendite: false },
      cat: [
        ['Commissioni portali', ['BOOKING', 'EXPEDIA', 'AIRBNB', 'COMMISSION', ' OTA', 'CHANNEL MANAGER']],
        ['Kit cortesia', ['KIT CORTESIA', 'SAPONETT', 'SHAMPOO', 'BAGNOSCHIUMA', 'BAGNODOCCIA', 'CIABATTE', 'AMENITIES', 'CUFFIA DOCCIA', 'KIT DENTALE']],
        ['Colazione e food', ['CORNETT', 'BRIOCHE', 'CAFFE', 'CAFFÈ', 'CAPSULE', 'LATTE', 'MARMELLAT', 'CONFETTUR', 'YOGURT', 'SUCCHI', 'SUCCO', 'PANE', 'FETTE BISCOTTATE', 'CEREALI', 'FRUTTA', 'AFFETTATI', 'FORMAGG', 'UOVA', 'BURRO', 'BISCOTT', 'TORTA']],
        ['Biancheria e lavanderia', ['LENZUOL', 'FEDERE', 'ASCIUGAMANI', 'ACCAPPATOI', ' TELI', 'COPRIMATERASS', 'PIUMIN', 'COPRIPIUMIN', 'LAVANDERIA', 'NOLEGGIO BIANCHERIA']],
        C.pulizia,
        ['Arredi e attrezzature', ['MATERASS', 'LETTO', 'LETTI', 'ARMADI', ' TV', 'TELEVISOR', 'CLIMATIZZ', 'FRIGOBAR', 'CASSAFORTE', 'LAMPAD', 'COMODINO', 'TENDE', 'SERRATURA']],
        ['Tassa di soggiorno', ['TASSA DI SOGGIORNO', 'IMPOSTA DI SOGGIORNO']],
        C.ufficio, ...tail]
    },

    { id: 'altro', n: 'Altra attività', s: 'Altra attività', d: 'Uffici, studi, servizi e ogni altro tipo di azienda',
      ic: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>',
      sede: ['Sede', 'Sedi', 'f'], acq: 'Acquisti',
      mod: { piazzali: true, gls: false, gasolio: false, lyreco: false, amazon: true, incassi: true, clienti: true, fornitori: true, magazzino: true, vendite: true },
      cat: [C.ufficio, C.pulizia, C.trasporti, C.mezzi,
        ['Merci e materiali', ['MATERIAL', 'MERCE', 'ARTICOLI', 'FORNITURA']],
        ['Servizi', ['SERVIZIO', 'SERVIZI', 'CANONE', 'ABBONAMENTO']],
        ...tail]
    }
  ];

  // sezioni che si possono accendere o spegnere (Dashboard, Acquisti, Fatture e Preventivi restano sempre)
  const MODULI = [
    { k: 'piazzali', t: s => s.sede[1], d: s => `Spese e confronto tra ${s.sede[2] ? 'le' : 'i'} tuo${s.sede[2] ? 'e' : 'i'} ${s.sede[1].toLowerCase()}, con mappa e classifica` },
    { k: 'gasolio', t: s => s.id === 'veicoli' ? 'Gasolio e noleggi' : 'Carburante e mezzi', d: () => 'Rifornimenti, chilometri, consumi e noleggi di furgoni e auto' },
    { k: 'gls', t: () => 'Spedizioni GLS', d: () => 'Analisi delle fatture GLS: costi per spedizione, destinazioni e peso' },
    { k: 'amazon', t: () => 'Amazon Business', d: () => 'Ordini e articoli Amazon ripartiti per sede, con controlli sull\'IVA' },
    { k: 'lyreco', t: () => 'Lyreco', d: () => 'Fatture Lyreco riga per riga: cancelleria, pulizia e consumabili' },
    { k: 'incassi', t: () => 'Incassi e ricavi', d: () => 'Chiusure di cassa e incassi giornalieri: con le fatture ai clienti danno ricavi e utile in Dashboard' },
    { k: 'clienti', t: () => 'Clienti', d: () => 'Anagrafica dei clienti con dati fiscali, fatturato e documenti' },
    { k: 'fornitori', t: () => 'Fornitori', d: () => 'Anagrafica dei fornitori con spesa, fatture da pagare e cataloghi' },
    { k: 'magazzino', t: () => 'Magazzino', d: () => 'Articoli, giacenze, carichi e scarichi, avviso sotto scorta' },
    { k: 'vendite', t: () => 'DDT e fatture ai clienti', d: () => 'DDT durante il mese e fatture di fine mese, con PDF e file XML per lo SdI' },
    { k: 'dipendenti', t: () => 'Dipendenti e presenze', d: () => 'Anagrafica del personale, timbrature dall\'app Presenze, ferie, permessi, scadenze e accessi con permessi per sezione' },
    { k: 'torental', t: () => 'Torental', d: () => 'Listino, ordini e clienti Torental', only: 'veicoli' }
  ];
  const SEMPRE = ['Dashboard', 'Acquisti', 'Fatture fornitori', 'Preventivi e catalogo fornitori'];
  const PIANI = { prova: 'Prova gratuita', base: 'Base', pro: 'Pro' };

  window.CDC_SETTORI = {
    list: L, moduli: MODULI, sempre: SEMPRE, piani: PIANI,
    get: id => L.find(s => s.id === id) || L.find(s => s.id === 'altro')
  };
})();
