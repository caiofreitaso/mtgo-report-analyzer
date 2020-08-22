INSERT INTO card(name,types,colors,effective_colors,cmc,effective_cmc)
VALUES

('Plains',  ARRAY['basic','land']::card_type[],ARRAY[]::card_color[],ARRAY[]::card_color[],0,0),
('Island',  ARRAY['basic','land']::card_type[],ARRAY[]::card_color[],ARRAY[]::card_color[],0,0),
('Swamp',   ARRAY['basic','land']::card_type[],ARRAY[]::card_color[],ARRAY[]::card_color[],0,0),
('Forest',  ARRAY['basic','land']::card_type[],ARRAY[]::card_color[],ARRAY[]::card_color[],0,0),
('Mountain',ARRAY['basic','land']::card_type[],ARRAY[]::card_color[],ARRAY[]::card_color[],0,0),

('Snow-Covered Plains',  ARRAY['basic','snow','land']::card_type[],ARRAY[]::card_color[],ARRAY[]::card_color[],0,0),
('Snow-Covered Island',  ARRAY['basic','snow','land']::card_type[],ARRAY[]::card_color[],ARRAY[]::card_color[],0,0),
('Snow-Covered Swamp',   ARRAY['basic','snow','land']::card_type[],ARRAY[]::card_color[],ARRAY[]::card_color[],0,0),
('Snow-Covered Forest',  ARRAY['basic','snow','land']::card_type[],ARRAY[]::card_color[],ARRAY[]::card_color[],0,0),
('Snow-Covered Mountain',ARRAY['basic','snow','land']::card_type[],ARRAY[]::card_color[],ARRAY[]::card_color[],0,0),

('Wastes',ARRAY['basic','land']::card_type[],ARRAY[]::card_color[],ARRAY[]::card_color[],0,0);
