-- 0022_super5_vinculo_tipologias_temperado.sql
-- Vínculo retroativo de peças do catálogo Super5 às tipologias de vidro
-- temperado cadastradas em 0021 (a partir da apostila técnica). Cada vínculo
-- abaixo foi conferido individualmente pelo texto de aplicação impresso no
-- catálogo (accessory_compatibilities.notes, igual ao nome do item) -- só
-- recebeu vínculo quando o texto cita a tipologia (ou uma característica
-- inequívoca dela) de forma clara. Itens de aplicação genérica continuam
-- sem vínculo -- não é lacuna, é honestidade sobre o que a fonte realmente
-- especifica (ex: parafuso/porca/escova usados em qualquer tipologia; "para
-- box" sem dizer qual das 3 variantes; "trilho 1030" compartilhado por 3
-- tipologias diferentes; "porta sanfonada" sem dizer 3 ou 6 folhas).
--
-- 187 peças estavam pendentes (typology_id NULL); 22 receberam vínculo aqui.
-- As 165 restantes seguem pendentes, listadas por categoria em docs/FONTES.md.

-- Box Frontal -- "para box frontal" citado literalmente no nome/aplicação.
UPDATE accessory_compatibilities ac
JOIN accessories a ON a.id = ac.accessory_id
SET ac.typology_id = (SELECT id FROM typologies WHERE name = 'Box Frontal')
WHERE a.manufacturer_id = (SELECT id FROM manufacturers WHERE name = 'Super5')
  AND a.code IN ('2021', '2022', '2024', '2025')
  AND ac.typology_id IS NULL;

-- Box de Canto -- suporte "a 90°" (configuração de canto, não frontal/giro).
UPDATE accessory_compatibilities ac
JOIN accessories a ON a.id = ac.accessory_id
SET ac.typology_id = (SELECT id FROM typologies WHERE name = 'Box de Canto')
WHERE a.manufacturer_id = (SELECT id FROM manufacturers WHERE name = 'Super5')
  AND a.code = '1350'
  AND ac.typology_id IS NULL;

-- Guarda-corpo / Sacada de Vidro -- "grapa para sacada" (fixação de painel de
-- vidro em sacada, igual à peça AF 75 da apostila p.29).
UPDATE accessory_compatibilities ac
JOIN accessories a ON a.id = ac.accessory_id
SET ac.typology_id = (SELECT id FROM typologies WHERE name = 'Guarda-corpo / Sacada de Vidro')
WHERE a.manufacturer_id = (SELECT id FROM manufacturers WHERE name = 'Super5')
  AND a.code IN ('1334', '1334TB')
  AND ac.typology_id IS NULL;

-- Vitrine Fixa 3 Peças -- "suporte ... p/ união de 3 vidros".
UPDATE accessory_compatibilities ac
JOIN accessories a ON a.id = ac.accessory_id
SET ac.typology_id = (SELECT id FROM typologies WHERE name = 'Vitrine Fixa 3 Peças')
WHERE a.manufacturer_id = (SELECT id FROM manufacturers WHERE name = 'Super5')
  AND a.code = '1315'
  AND ac.typology_id IS NULL;

-- Basculante (tipologia já existente, Livro 5) -- engate de corrente em
-- alvenaria, mesma família dos itens 1003/1003A/1003CM já vinculados a essa
-- tipologia (corrente/argola/cordão para basculante).
UPDATE accessory_compatibilities ac
JOIN accessories a ON a.id = ac.accessory_id
SET ac.typology_id = (SELECT id FROM typologies WHERE name = 'Basculante')
WHERE a.manufacturer_id = (SELECT id FROM manufacturers WHERE name = 'Super5')
  AND a.code = '1000'
  AND ac.typology_id IS NULL;

-- Porta Pivotante Única (Vidro Temperado) -- dobradiça/cantoneira/batedeira
-- para porta de vidro giratória fixada direto em madeira/alvenaria/granito
-- (sem marco de alumínio) -- mesma família de instalação "com cantoneira"
-- citada na tabela de folgas da apostila (p.32). Inclui a contra-fechadura
-- com batente (1531), par do mesmo conjunto de fechadura/batedeira em
-- alvenaria (1504A/1504AX/1504ATD/1504ATE).
UPDATE accessory_compatibilities ac
JOIN accessories a ON a.id = ac.accessory_id
SET ac.typology_id = (SELECT id FROM typologies WHERE name = 'Porta Pivotante Única (Vidro Temperado)')
WHERE a.manufacturer_id = (SELECT id FROM manufacturers WHERE name = 'Super5')
  AND a.code IN ('1750', '1751', '1755', '1756D', '1756E', '1760', '1761', '1762',
                 '1504A', '1504ATD', '1504ATE', '1504AX', '1531')
  AND ac.typology_id IS NULL;
