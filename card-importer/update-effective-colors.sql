UPDATE card
SET effective_colors = ARRAY[]::card_color[]
WHERE name = 'Simian Spirit Guide'
OR name LIKE 'Leyline of %';