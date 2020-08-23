UPDATE decklist
SET is_nonland_main = (NOT is_sideboard)
AND (card_name NOT IN (
    SELECT name
    FROM card
    WHERE card.types && ARRAY['land']::card_type[]
));