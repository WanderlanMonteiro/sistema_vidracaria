<?php

declare(strict_types=1);

// Gerador da seed do catálogo Super5 (Ferragens para Vidros Temperados).
// Não faz parte do runtime -- roda uma vez, produz o .sql que vai pra
// database/seeds/. Lista de itens transcrita página a página do PDF
// (54 páginas: pág.1 capa, pág.2-53 itens, pág.54 tabela de cores).
//
// Regras de classificação (auditáveis, não "inventadas" na hora):
// - category: por palavra-chave no nome (dobradiça/roldana/fechadura/trinco/
//   puxador/suporte/mola/grapa/cantoneira/vidro-consumível/outro).
// - vínculo com tipologia (accessory_compatibilities.typology_id): só quando
//   o nome cita literalmente "correr", "basculante", "maxim-ar"/"maximar",
//   "giro" ou "pivotante" -- as 4 categorias de typologies que têm
//   correspondência direta e inequívoca no catálogo. Todo item recebe uma
//   linha em accessory_compatibilities com notes = frase de aplicação tal
//   como impressa (mesmo sem typology_id), pra "aplicação" ficar registrada
//   em 100% dos itens, não só nos que batem com tipologia existente.
//   Aplicações que NÃO têm tipologia cadastrada ainda (box, sacada, granito/
//   alvenaria, rack, vitrine, espelho, porta sanfonada, madeira) ficam com
//   typology_id NULL -- não é inventada tipologia nova aqui.

// [codigo, nome, pagina]
$items = [
    // pág 2
    ['1000', 'Engate para corrente em alvenaria', 2],
    ['1001', 'Botão de correção com engate', 2],
    ['1001L', 'Botão de correção com lâmina com engate', 2],
    ['1002', 'Botão de correção com parafuso', 2],
    // pág 3
    ['1002L', 'Botão de correção lâmina', 3],
    ['1003', 'Corrente para basculante', 3],
    ['1003A', 'Argola para basculante', 3],
    ['1003CM', 'Cordão de polipropileno p/ basculante com argola', 3],
    // pág 4
    ['1006', 'Parafuso sistema "só vidros"', 4],
    ['1009', 'Pivô para dobradiça 1101, 1230 e 1231', 4],
    ['1010', 'Botão de acabamento p/ puxador 1680', 4],
    ['1012', 'Mola hidráulica de piso', 4],
    // pág 5
    ['1012S', 'Mola hidráulica aérea', 5],
    ['1013', 'Pivô inferior para dobradiça 1103 de latão', 5],
    ['1014', 'Pivô inferior para dobradiça 1102', 5],
    ['1033', 'Conjunto de porca e parafuso para ferragens', 5],
    // pág 6
    ['1033A', 'Conjunto parafuso para fixação com tampa plástica', 6],
    ['1038', 'Escova de polipropileno para perfis de vedação 1030/1030L/1034/1034S/1035/1036/1039/1039B -- base x altura 5mm x 5mm', 6],
    ['1038A', 'Escova de polipropileno para perfis de vedação -- base x altura 5mm x 7mm', 6],
    ['1038B', 'Escova de polipropileno para perfis de vedação -- base x altura 7mm x 10mm', 6],
    ['1038C', 'Escova de polipropileno para perfis de vedação -- base x altura 7mm x 5mm', 6],
    ['1038D', 'Escova de polipropileno para perfis de vedação -- base x altura 7mm x 5mm (adesiva)', 6],
    ['1038E', 'Escova de polipropileno para perfis de vedação -- base x altura 5mm x 10mm', 6],
    ['1047', 'Pestana de borracha para vedação', 6],
    ['1047A', 'Pestana de borracha para vedação', 6],
    ['1101', 'Dobradiça pivotante superior para 1009', 6],
    // pág 7
    ['1101M', 'Mini dobradiça pivotante superior e inferior', 7],
    ['1101G', 'Mola dobradiça superior para 1009G', 7],
    ['1102', 'Dobradiça pivotante inferior', 7],
    ['1102M', 'Mini dobradiça pivotante superior', 7],
    // pág 8
    ['1102G', 'Max dobradiça pivotante inferior para 1014G', 8],
    ['1103', 'Dobradiça inferior para mola de piso', 8],
    ['1103I', 'Max dobradiça inferior para mola de piso', 8],
    ['1103G', 'Max dobradiça inferior para mola de piso', 8],
    ['1114', 'Dobradiça automática para box', 8],
    // pág 9
    ['1114D', 'Dobradiça dupla automática', 9],
    ['1114E', 'Dobradiça dupla automática', 9],
    ['1115', 'Dobradiça simples para box', 9],
    ['1122', 'Carrinho duplo para 1030 (portas até 80Kg)', 9],
    ['1122M', 'Mini carrinho simples (1 furo) p/ 1030 (portas até 20Kg)', 9],
    // pág 10
    ['1122S', 'Carrinho simples (2 furos) p/ 1030 (portas até 30Kg)', 10],
    ['1123', 'Dobradiça para basculante 50x50mm', 10],
    ['1125', 'Roldana para porta e janela de correr', 10],
    ['1125D', 'Roldana dupla com balancim', 10],
    // pág 11
    ['1125E', 'Roldana para box excêntrica', 11],
    ['1130', 'Dobradiça p/ basculante c/pino 50x100mm', 11],
    ['1131', 'Dobradiça maxim-ar V/V 40mm entre furos', 11],
    ['1132', 'Dobradiça maxim-ar V/A 40mm entre furos', 11],
    // pág 12
    ['1133', 'Dobradiça maxim-ar V/A 50mm entre furos', 12],
    ['1134', 'Dobradiça maxim-ar V/V 50mm entre furos', 12],
    ['1136', 'Dobradiça simples pequena para janela', 12],
    ['1137', 'Dobradiça dupla pequena para janela', 12],
    // pág 13
    ['1141', '2 mini dobradiças pivô de pressão (6mm) para rack', 13],
    ['1150', 'Roldana quádrupla para trilho 1030', 13],
    ['1150S', 'Roldana dupla para trilho 1030 (box)', 13],
    ['1200', 'Capuchinho para trinco e fechadura', 13],
    // pág 14
    ['1201', 'Bucha para pivot de dobradiça', 14],
    ['1203', 'Suporte de bandeira para dobradiça 1101', 14],
    ['1209', 'Facão simples para bandeira e fixo para 1101', 14],
    ['1209D', 'Facão a 90° para 1101', 14],
    ['1209E', 'Facão a 90° para 1101', 14],
    // pág 15
    ['1230', 'Dobradiça bucha para basculante 50x50mm', 15],
    ['1231', 'Dobradiça bucha para basculante 50x100mm', 15],
    ['1302', 'Suporte de canto', 15],
    ['1305', 'Suporte central sem núcleo', 15],
    // pág 16
    ['1306', 'Suporte para união de 2 vidros', 16],
    ['1307', 'Suporte sem núcleo para união de 3 vidros em T', 16],
    ['1308', 'Suporte com núcleo para união de 3 vidros em T para piso', 16],
    ['1310', 'Suporte sem núcleo para união de 3 vidros', 16],
    // pág 17
    ['1315', 'Suporte sem núcleo com batedeira p/ união de 3 vidros', 17],
    ['1316', 'Suporte sem núcleo para união de 4 vidros', 17],
    ['1319', 'Suporte para união de 4 vidros a 90°', 17],
    ['1320', 'Suporte central sem núcleo p/ união de 2 vidros a 90°', 17],
    // pág 18
    ['1326', 'Mini suporte para fixação 40x40mm', 18],
    ['1321A', 'Suporte central sem núcleo p/ união de 2 vidros a 135°', 18],
    ['1322', 'Suporte de centro com núcleo p/ união de 2 vidros a 90°', 18],
    ['1323', 'Suporte p/ união de 4 vidros perpendiculares', 18],
    // pág 19
    ['1321', 'Suporte piso/teto com núcleo p/ união de 2 vidros a 90°', 19],
    ['1329', 'Suporte central para fixação 50x50mm', 19],
    ['1332', 'Suporte de centro para porta sanfonada, portas leves ou janelas', 19],
    ['1333', 'Suporte para prateleiras', 19],
    // pág 20
    ['1334', 'Grapa para sacada 50x65mm (sem recorte)', 20],
    ['1334TB', 'Grapa para sacada', 20],
    ['1335', 'Suporte para união de 2 vidros a 135°', 20],
    ['1336', 'Cantoneira completa p/ sistema "só vidros" c/ 1006', 20],
    // pág 21
    ['1340', 'Suporte de canto com rosca p/ roldanas', 21],
    ['1341', 'Suporte de centro com rosca p/ roldana 1150', 21],
    ['1350', 'Suporte superior p/ box a 90° (sem recorte)', 21],
    ['1400', 'Batedeira para trinco de basculante', 21],
    // pág 22
    ['1401', 'Batedeira simples', 22],
    ['1402', 'Batedeira sem núcleo de pressão', 22],
    ['1403', 'Batedeira com núcleo p/ porta sanfonada', 22],
    ['1404', 'Guia de nylon para porta de correr', 22],
    // pág 23
    ['1405', 'Amortecedor curvo de borracha 15x17cm', 23],
    ['1406', 'Amortecedor curvo de borracha 15x17cm', 23],
    ['1408', 'Contra trinco para 1519 e 1521', 23],
    ['1408A', 'Contra trinco com aba para 1519 e 1521', 23],
    // pág 24
    ['1410', 'Contra trinco c/ 4mm auto-adesivo para 1813J', 24],
    ['1411', 'Contra trinco c/ 7mm auto-adesivo para 1813P', 24],
    ['1500', 'Fechadura de segurança para vidros sem recortes', 24],
    ['1501', 'Fechadura com trinco rolete', 24],
    ['1502', 'Trinco com rolete de um lado', 24],
    // pág 25
    ['1503', 'Trinco com rolete duplo', 25],
    ['1504AX', 'Batedeira em alvenaria p/ 1520X (c/borracha)', 25],
    ['1504', 'Contra fechadura para 1520/1550', 25],
    ['1504A', 'Batedeira em alvenaria para 1520 e 1550', 25],
    // pág 26
    ['1504ATD', 'Batedeira em alvenaria p/ 1520TA (vista externa)', 26],
    ['1504ATE', 'Batedeira em alvenaria p/ 1520TA (vista externa)', 26],
    ['1504P', 'Contra fechadura de pressão para 1520P', 26],
    ['1504PX', 'Contra fechadura p/ 1520PX com puxador embutido', 26],
    ['1504TAD', 'Contra fechadura sem maçaneta (vidro fixo)', 26],
    ['1504TAE', 'Contra fechadura sem maçaneta (vidro fixo)', 26],
    // pág 27
    ['1504TAMD', 'Contra fechadura p/ maçaneta (2 portas)', 27],
    ['1504TAME', 'Contra fechadura p/ maçaneta (2 portas)', 27],
    ['1510', 'Fechadura bico-de-papagaio com pino e trava', 27],
    ['1510M', 'Mini fechadura com um cilindro p/ janela', 27],
    ['1504X', 'Contra fechadura para 1520X', 27],
    // pág 28
    ['1504XP', 'Contra fechadura de pressão para 1520XP', 28],
    ['1511AM', 'Mini testeira para 1510M', 28],
    ['1511BX', 'Testeira para 1510X e 1520X no piso', 28],
    ['1511AX', 'Testeira para 1510X', 28],
    ['1511M', 'Mini contra fechadura com proteção p/ 1510M', 28],
    // pág 29
    ['1510X', 'Fechadura com furação para porta de correr', 29],
    ['1510XP', 'Fechadura de pressão para porta de correr', 29],
    ['1511', 'Contra fechadura com aba de proteção para 1510', 29],
    ['1511A', 'Testeira de parede para 1510', 29],
    // pág 30
    ['1511X', 'Contra fechadura para 1510X', 30],
    ['1511XP', 'Contra fechadura de pressão para 1510XP', 30],
    ['1519', 'Trinco inferior sem núcleo 50x100mm', 30],
    ['1519A', 'Contra trinco sem aba para 1519', 30],
    // pág 31
    ['1520', 'Fechadura central ou piso com 2 cilindros', 31],
    ['1520P', 'Fechadura de pressão com tetra chave', 31],
    ['1520PX', 'Fechadura 1520 com puxador embutido', 31],
    ['1520TA', 'Fechadura central p/ maçaneta com 2 cilindros (maçaneta vendida separadamente)', 31],
    // pág 32
    ['1520X', 'Fechadura blindex p/ portas de abrir c/ furação', 32],
    ['1520XP', 'Fechadura reforçada de pressão p/ porta de giro', 32],
    ['1521', 'Trinco para janela ou porta', 32],
    ['1521L', 'Trinco com ferrolho lateral', 32],
    // pág 33
    ['1523', 'Trinco central para basculante', 33],
    ['1524', 'Contra trinco sem aba para 1521 e 1523', 33],
    ['1525', 'Contra trinco com aba p/ 1521 e 1523', 33],
    ['1529', 'Contra trinco de pressão para 1800C', 33],
    // pág 34
    ['1531', 'Contra fechadura com batente p/ 1520 e 1550', 34],
    ['1531X', 'Contra fechadura para 1520X', 34],
    ['1532', 'Contra trinco com aba para 1519', 34],
    ['1550', 'Fechadura central ou piso com tetra chave', 34],
    // pág 35
    ['1570', 'Fecho central V/V bate/fecha', 35],
    ['1571', 'Fecho lateral V/A bate-fecha', 35],
    ['1580', 'Fechadura elétrica V/V para recorte', 35],
    ['1581', 'Fechadura elétrica V/A para recorte', 35],
    // pág 36
    ['1587', 'Haste para Maxim-Ar + conjunto acessório V/V para haste', 36, 'Comprimentos disponíveis: 15/20/25/30/35/40/45/50/55/60cm. Mesmo código 1587 impresso no catálogo para as duas peças do conjunto (haste + conjunto acessório V/V com 2 furos) -- preservado como consta na fonte, não desdobrado em código novo.'],
    ['1587A', 'Conjunto acessório V/A para haste 1587', 36],
    ['1587V', 'Conjunto acessório V/V para haste 1587', 36],
    // pág 37
    ['1589', 'Conjunto acessório V/V para haste 1589', 37],
    ['1607i', 'Puxador de madeira (cor Imbuia)', 37],
    ['1607', 'Puxador de madeira (cor marfim)', 37],
    ['1608', 'Puxador de vidro', 37],
    ['1613', 'Puxador de resina', 37],
    // pág 38
    ['1629', 'Puxador para box (25mm)', 38],
    ['1630', 'Puxador para box (19mm)', 38],
    ['1629TEK', 'Puxador para box', 38],
    ['1650', 'Puxador para janela de correr (25mm)', 38],
    ['1651', 'Puxador para janela de correr (19mm)', 38],
    // pág 39
    ['1650TEK', 'Puxador para janela de correr', 39],
    ['1660', 'Distanciador para puxador de vidro 1608', 39],
    ['1671M', 'Mini puxador p/ transpasse portas e janelas com um furo', 39],
    ['1671MD', 'Mini puxador duplo com transpasse para portas e janelas com um furo', 39],
    ['1672', 'Puxador auto-adesivo para transpasse', 39],
    // pág 40
    ['1676', 'Puxador tubular com diâmetro de 25mm (300mm entre furos)', 40],
    ['1678', 'Puxador tubular reto L padrão 500mm x 300mm', 40],
    ['1679', 'Puxador tubular reto L padrão 800mm x 500mm', 40],
    ['Colonial Pux', 'Puxador Colonial tubular p/ portas (300mm entre furos)', 40],
    // pág 41
    ['1680PT', 'Porta toalha tubular c/ 500mm entre furos', 41],
    ['1696', 'Puxador tubular tipo H (diâmetro 25mm)', 41],
    ['1697S', 'Puxador tubular em "S" (diâmetro 25mm)', 41],
    ['1702', 'Fixador de porta no rodapé/piso', 41],
    // pág 42
    ['1703A', 'Suporte fenda "U" cromado (para vidro 6mm)', 42],
    ['1703B', 'Suporte fenda "U" cromado (para vidro 8mm)', 42],
    ['1703C', 'Suporte fenda "U" cromado (para vidro 10mm)', 42],
    ['1704', 'Fixador de pressão para portas de extintores', 42],
    ['1710', 'Conjunto mão-de-amigo p/ portas de correr com 1030', 42],
    ['1710M', 'Mini conjunto mão-de-amigo p/ portas de correr 1030', 42],
    // pág 43
    ['1711M', 'Mini conjunto mão-de-amigo p/ portas de correr 1030', 43],
    ['1750', 'Dobradiça simples para madeira/vidro/alvenaria', 43],
    ['1751', 'Dobradiça dupla granito/madeira/vidro', 43],
    ['1755', 'Dobradiça automática madeira/alvenaria/vidro', 43],
    // pág 44
    ['1756D', 'Dobradiça automática dupla granito/madeira/vidro', 44],
    ['1756E', 'Dobradiça automática dupla granito/madeira/vidro', 44],
    ['1760', 'Cantoneira granito/alvenaria', 44],
    ['1761', 'Cantoneira granito/granito', 44],
    ['1762', 'Cantoneiro dupla granito/granito', 44],
    // pág 45
    ['1800', 'Trinco para janela de correr', 45],
    ['1800A', 'Trinco para janela de correr', 45],
    ['1800B', 'Trinco de pressão para janela de correr', 45],
    ['1800C', 'Trinco de pressão sem núcleo', 45],
    // pág 46
    ['1800AS', 'Trinco de pressão para janela de correr', 46],
    ['1800S', 'Trinco de pressão para janela de correr', 46],
    ['1810D', 'Trinco direito para janela de correr', 46],
    ['1810E', 'Trinco esquerdo para janela de correr', 46],
    // pág 47
    ['1813P', 'Trinco para porta de correr que permite transpasse', 47],
    ['1906B', 'Suporte p/ mola aérea (bandeira) -- dispensa recorte', 47],
    ['1906P', 'Suporte p/ mola aérea (porta) -- dispensa recorte', 47],
    ['1907', 'Silicone incolor', 47],
    // pág 48
    ['1912', 'Fechadura morcego para vitrines', 48],
    ['1913', 'Fechadura "só cilindro" para rack', 48],
    ['1913P', 'Fechadura de pressão com lingueta para rack', 48],
    ['2001', 'Parafuso para espelho furado', 48],
    // pág 49
    ['2002', 'Parafuso para espelho furado', 49],
    ['2009', 'Suporte Tucano', 49],
    ['2010', 'Conjunto deslizante', 49],
    ['2021', 'Kit Millennium -- para box frontal 1,5m', 49],
    ['2022', 'Kit Millennium -- para box frontal 2,0m', 49],
    // pág 50
    ['2024', 'Kit articulado -- para box frontal 1,5m', 50],
    ['2025', 'Kit articulado -- para box frontal 2,0m', 50],
    ['1622', "Puxador tubular 1' -- meia lua", 50],
    ['Colonial', 'Puxador barra chata com 30cm entre furos', 50],
    ['Space', 'Puxador barra chata com um furo', 50],
    // pág 51
    ['Unique', 'Puxador p/ portas, janelas e box de correr (permite transpasse)', 51],
    ['Real', 'Puxador p/ portas, janelas e box de correr', 51],
    ['Realeza', 'Puxador p/ portas, janelas e box de correr', 51],
    ['2026', 'Spyder com regulagem -- 1 haste', 51],
    ['2027', 'Spyder com regulagem -- 2 hastes', 51],
    ['2028', 'Spyder com regulagem -- 3 hastes', 51],
    ['2029', 'Spyder com regulagem -- 4 hastes', 51],
    // pág 52
    ['9000', 'Fixador biométrica Stand Alone', 52],
    ['Estrutural', 'Silicone estrutural', 52],
    ['Fixa espelho', 'Fixador para espelhos, selante de alta densidade', 52],
    // pág 53
    ['Convexo', 'Espelho convexo (diâmetros disponíveis: 30/40/50/60cm)', 53],
];

// --- Classificação de categoria por palavra-chave (auditável) -------------
function classify(string $name): string
{
    $n = mb_strtolower($name);
    $rules = [
        'DOBRADICA' => ['dobradiça', 'dobradiço'],
        'ROLDANA' => ['roldana', 'carrinho'],
        'FECHADURA' => ['fechadura'],
        'TRINCO' => ['trinco'],
        'FECHO' => ['contra fechadura', 'contra trinco', 'batedeira', 'testeira', 'fecho'],
        'PUXADOR' => ['puxador'],
        'MOLA' => ['mola'],
        'SUPORTE' => ['suporte'],
        'GRAPA' => ['grapa'],
        'CANTONEIRA' => ['cantoneira', 'cantoneiro'],
    ];
    foreach ($rules as $category => $keywords) {
        foreach ($keywords as $kw) {
            if (str_contains($n, $kw)) {
                return $category;
            }
        }
    }
    return 'OUTRO';
}

// --- Vínculo com tipologia existente por palavra-chave literal -------------
// category em typologies: CORRER, GIRO, MAXIM_AR, PIVOTANTE, BASCULANTE (as únicas
// com correspondência inequívoca no catálogo). Nunca cria tipologia nova aqui.
function matchTypologyCategory(string $name): ?string
{
    $n = mb_strtolower($name);
    if (str_contains($n, 'correr')) return 'CORRER';
    if (str_contains($n, 'basculante')) return 'BASCULANTE';
    if (str_contains($n, 'maxim-ar') || str_contains($n, 'maximar')) return 'MAXIM_AR';
    if (str_contains($n, 'pivotante')) return 'PIVOTANTE';
    if (str_contains($n, 'porta de giro') || str_contains($n, 'porta giro')) return 'GIRO';
    return null;
}

$sql = "-- 0020_super5_ferragens.sql\n";
$sql .= "-- Catálogo Super5 (Ferragens para Vidros Temperados), 54 páginas, gerado por\n";
$sql .= "-- script (database/../scripts/generate_super5_seed.php) a partir da transcrição\n";
$sql .= "-- página a página do PDF -- ver docs/FONTES.md para a lista de exclusões (itens\n";
$sql .= "-- de embalagem/armazenagem sem relação com ferragem: Papel Crepado, Filme\n";
$sql .= "-- Strech, Fita dupla face, Gaveta para armazenagem) e limitações da classificação\n";
$sql .= "-- automática de categoria/tipologia.\n\n";

$sql .= "INSERT INTO manufacturers (name, legal_name, website, notes) VALUES\n";
$sql .= "('Super5', NULL, 'super5.com.br', 'Fabricante de ferragens para vidro temperado. Catálogo eletrônico \"Super Catálogo de Ferragens para Vidros Temperados\", 54 páginas. Telefone impresso no rodapé do catálogo: +55 41 3249-5555.');\n";
$sql .= "SET @mfr_super5 = LAST_INSERT_ID();\n\n";

$sql .= "INSERT INTO technical_sources (manufacturer_id, title, file_name, document_type, is_uploaded, page_count, notes) VALUES\n";
$sql .= "(@mfr_super5, 'Super Catálogo de Ferragens para Vidros Temperados (Super5)', 'CatalogoFerragensVidroSuper5.pdf', 'CATALOGO', 1, 54, 'Págs. 1 (capa) e 54 (tabela de cores de acabamento, não geram linha de acessório) fora da contagem de itens. Cada item mostra: código, nome/aplicação, foto do produto e desenho esquemático de montagem (furação/pontos de fixação), sem cota de tipologia formal explícita -- a aplicação é extraída do próprio nome impresso.');\n";
$sql .= "SET @src_super5 = LAST_INSERT_ID();\n\n";

// uma source_reference por página usada
$pages = array_values(array_unique(array_map(fn ($i) => $i[2], $items)));
sort($pages);
$sql .= "INSERT INTO source_references (technical_source_id, page_number, section_title, extracted_by) VALUES\n";
$rows = [];
foreach ($pages as $p) {
    $rows[] = "(@src_super5, {$p}, 'Catálogo Super5 -- página {$p}', 'script-extraction')";
}
$sql .= implode(",\n", $rows) . ";\n\n";
// variáveis de sessão por página (uma SELECT por página, MySQL não suporta LAST_INSERT_ID múltiplo em VALUES)
foreach ($pages as $i => $p) {
    $offset = count($pages) - $i - 1;
    $sql .= "SET @src_p{$p} = (SELECT id FROM source_references WHERE technical_source_id = @src_super5 AND page_number = {$p});\n";
}
$sql .= "\n";

$sql .= "-- Acessórios (código único por fabricante -- ver UNIQUE KEY uk_accessories_manufacturer_code)\n";
$sql .= "INSERT INTO accessories (manufacturer_id, code, name, category, description, origin_type, status_code, source_reference_id) VALUES\n";
$rows = [];
foreach ($items as $idx => $item) {
    [$code, $name, $page] = $item;
    $description = $item[3] ?? null;
    if (mb_strlen($name) > 180) {
        throw new RuntimeException("Item '{$code}' (pág. {$page}) tem nome com " . mb_strlen($name) . " caracteres, acima do limite de 180 da coluna accessories.name. Mova o excedente para a description (4º elemento do item).");
    }
    $cat = classify($name);
    $codeEsc = addslashes($code);
    $nameEsc = addslashes($name);
    $descExpr = $description !== null ? "'" . addslashes($description) . "'" : 'NULL';
    $rows[] = "(@mfr_super5, '{$codeEsc}', '{$nameEsc}', '{$cat}', {$descExpr}, 'ENCONTRADO_DOCUMENTO', 'CATALOGADO', @src_p{$page})";
}
$sql .= implode(",\n", $rows) . ";\n\n";

// Como accessories não expõe LAST_INSERT_ID por lote (insert múltiplo), recupera
// os ids recém-criados por manufacturer_id+code (código é único por fabricante).
$sql .= "-- Vínculo de aplicação/tipologia (accessory_compatibilities) -- notes sempre\n";
$sql .= "-- preenchido com a aplicação tal como impressa; typology_id só quando a\n";
$sql .= "-- categoria bate literalmente com uma tipologia já cadastrada (CORRER,\n";
$sql .= "-- BASCULANTE, MAXIM_AR, PIVOTANTE, GIRO). Sem tipologia formal ainda para\n";
$sql .= "-- box, sacada, granito/alvenaria, rack, vitrine, porta sanfonada -- não\n";
$sql .= "-- inventadas aqui, ficam com typology_id NULL até o usuário confirmar.\n";
$compatRows = [];
foreach ($items as [$code, $name, $page]) {
    $codeEsc = addslashes($code);
    $nameEsc = addslashes($name);
    $typCat = matchTypologyCategory($name);
    $typExpr = $typCat !== null
        ? "(SELECT id FROM typologies WHERE category = '{$typCat}' LIMIT 1)"
        : 'NULL';
    $compatRows[] = "((SELECT id FROM accessories WHERE manufacturer_id = @mfr_super5 AND code = '{$codeEsc}'), {$typExpr}, '{$nameEsc}', @src_p{$page})";
}
$sql .= "INSERT INTO accessory_compatibilities (accessory_id, typology_id, notes, source_reference_id) VALUES\n";
$sql .= implode(",\n", $compatRows) . ";\n\n";

$sql .= "-- Desenho esquemático de cada item = imagem da página do catálogo onde ele\n";
$sql .= "-- aparece (mesmo padrão já usado para Gold III antes da remoção pedida pelo\n";
$sql .= "-- usuário -- ver docs/FONTES.md). Vários itens compartilham a mesma imagem de\n";
$sql .= "-- página, o que é esperado (o catálogo lista ~3-4 itens por página).\n";
$sql .= "INSERT INTO technical_drawings (subject_type, subject_id, file_path, caption, source_reference_id) VALUES\n";
$drawRows = [];
foreach ($items as [$code, $name, $page]) {
    $codeEsc = addslashes($code);
    $captionEsc = addslashes("{$code} -- {$name}");
    $pageStr = str_pad((string) $page, 2, '0', STR_PAD_LEFT);
    $drawRows[] = "('ACCESSORY', (SELECT id FROM accessories WHERE manufacturer_id = @mfr_super5 AND code = '{$codeEsc}'), 'uploads/catalogos/super5/pagina-{$pageStr}.jpg', '{$captionEsc}', @src_p{$page})";
}
$sql .= implode(",\n", $drawRows) . ";\n";

file_put_contents(__DIR__ . '/../database/seeds/0020_super5_ferragens.sql', $sql);
echo "Gerado: " . count($items) . " itens, " . count($pages) . " páginas.\n";
echo "Arquivo: database/seeds/0020_super5_ferragens.sql (" . strlen($sql) . " bytes)\n";
