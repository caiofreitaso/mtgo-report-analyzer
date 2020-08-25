#!/usr/bin/node
"use strict";

const args = process.argv.slice(2);

if (args.length != 1) {
    console.log("Usage: ./json-parser.js TOURNAMENT_JSON");
    console.log("");
    console.log("This parser only works for Badaro's MTGO Decklist Cache.");

    process.exit(1);
}

const TournamentData = require(args[0]);

function fixString(str) {
    return str.replace("'","''");
}
function insertCard(card, sideboard) {
    let fixedName = fixString(card.CardName);
    return "INSERT INTO decklist(deck_id,card_name,quantity,is_sideboard) VALUES"
        + " ("
            + "this_deck,"
            + `(SELECT name FROM card WHERE name = '${fixedName}' OR name LIKE '${fixedName} // %'),`
            + `${card.Count},`
            + `${sideboard}`
        + ");\n";
}

let sql = "BEGIN TRANSACTION;";
sql += "DO $$\n";
sql += "DECLARE this_tournament int;\n";
sql += "DECLARE this_deck int;\n";
sql += "BEGIN\n";
sql += "INSERT INTO tournament(type,date) VALUES"
    + ` ('${fixString(TournamentData.Tournament.Name)}','${TournamentData.Decks[0].Date}')`
    + " RETURNING id INTO this_tournament;\n";

for (let i = 0; i < TournamentData.Decks.length; i++) {
    let decklist = TournamentData.Decks[i];

    sql += "INSERT INTO deck(tournament_id,player,position) VALUES"
        + ` (this_tournament,'${fixString(decklist.Player)}',${i+1})`
        + " RETURNING id INTO this_deck;\n";
    
    for (let card of decklist.Mainboard) {
        sql += insertCard(card, false);
    }
    for (let card of decklist.Sideboard) {
        sql += insertCard(card, true);
    }
}
sql += "END $$;\n";
sql += "COMMIT;\n";

console.log(sql);
