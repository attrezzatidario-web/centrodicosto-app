# Team di agenti — Centro di Costo

Gli agenti sono **attività programmate di Claude**: partono, controllano, scrivono un report JSON nella cartella Drive
«Centro di Costo - Team» (id 1aSwcajorld0_dj6--BdrvOtAoMp3Vea2) e si fermano. Non girano sul server del gestionale.

- La Console (sezione **Team**, `console/console.js` → `vTeam`) legge i report tramite uno **script Google separato**
  (`agenti/team.gs`, progetto Apps Script «Centro di Costo - Team», indirizzo in `TEAM_URL`: https://script.google.com/macros/s/AKfycbzzTczF9lPzqEx57olsxpO6XHZK9lQSZsbX1cSwzXN-0DauWYYijZzKJpX4D3Lu2Qg/exec).
- **Code.gs non contiene nulla del Team**: chi modifica Code.gs non deve aggiungere né togliere niente per gli agenti.
- Il token della Console viene verificato da team.gs chiedendo allo script principale l'azione `me` (solo l'amministratore).

Formato del report: `{ agente, data (ISO), stato: ok|warn|bad, titolo, voci: [{ stato, testo, dettaglio }], durata }`.
Nome file: `<agente>-AAAA-MM-GG-HHMM.json`.

| Agente | Quando | Cosa fa | Script |
|---|---|---|---|
| guardiano | ogni giorno 6:34 | demo sezione per sezione, Console, Presenze, sito online, backup settimanale, Foglio | `agenti/guardiano.mjs` |
| informatico | ogni lunedì 7:12 | rivede i commit della settimana, sicurezza, peso dei file, coerenza versioni; solo suggerimenti | — |

Regole: gli agenti **non modificano mai** codice, Fogli o dati dei clienti. Le modifiche le fa Claude in chat su richiesta di Dario.

## Chat con gli agenti (team.gs team-2)
Nella Console › Team, cliccando una scrivania (o una scheda) si apre a destra la chat con l'agente. La Console chiama team.gs con `action: 'chat'`; team.gs risponde con l'API Anthropic usando la chiave `ANTHROPIC_KEY` nelle Proprietà dello script (mai nel repo), solo in base ai report dell'agente, max 60 messaggi/giorno. L'agente non esegue nulla: per modifiche si scrive a Claude nella chat del progetto.
