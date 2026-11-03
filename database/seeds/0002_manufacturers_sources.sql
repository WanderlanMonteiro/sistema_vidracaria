-- 0002_manufacturers_sources.sql
-- Fabricantes, fontes técnicas e linhas de produto.
-- Fontes com is_uploaded=1 e sem perfis ainda associados (Suprema, Gold III) estão
-- pendentes de uma segunda passada de extração (ver docs/FONTES.md).

INSERT INTO manufacturers (id, name, legal_name, website, notes) VALUES
(1, 'Perfil Alumínio do Brasil', 'Perfil Alumínio do Brasil S/A', 'perfilaluminio.com.br',
 'Marca comercial Alconort. Fabricante das linhas Ecoline 1.6, Ecoline 2.5, UNNION, Chroma, Sophia e outras. Fonte: contracapa dos catálogos Ecoline 2.5 e UNNION.'),
(2, 'Alcoa / Alumínio & Cia', NULL, NULL, 'Fabricante da linha Gold (Gold III Perfis e Acessórios).'),
(3, 'Tec-Vidro', NULL, NULL, 'Fabricante da linha Suprema, perfis de revenda e fachada cortina.'),
(4, 'Asa Alumínio S.A.', NULL, NULL, 'Fabricante do Sistema Flex e do Sistema de Encaixe Multifuncional, citado no Livro 5 de Serralheria (fonte de referência, não catálogo de perfis próprio anexado).'),
(5, 'Hydro Building Systems', 'Hydro Alumínio Acro S.A.', NULL, 'Autora do guia técnico geral "Esquadrias de Alumínio: como especificar, comprar e conservar" (2004).');

INSERT INTO technical_sources (id, manufacturer_id, title, file_name, source_url, edition, document_type, is_uploaded, page_count, notes) VALUES
(1, NULL, 'Serralheria Alumínios - Livro 5', '0207c560-5_SERRALHERIA_DE_ALUM_NIO__HIST_RIA_E_PR_TICA.pdf', NULL, NULL, 'LIVRO_TECNICO', 1, 28,
 'Livro técnico geral de serralheria de alumínio: história, linhas/sistemas, corte, usinagem, montagem, protótipo, glossário. Contém a fórmula de referência Asa Flex (p.16).'),
(2, 1, 'Catálogo Técnico Ecoline 2.5 / Ecoline 2.5 SGT-GTS', '8d96fcd9-ecoline25resumidositecompressed.pdf', 'https://alconort.com.br/wp-content/uploads/2023/09/ecoline-25-resumido-site-compressed.pdf', '5ª Edição - Junho 2023', 'CATALOGO', 1, 41,
 'Numeração impressa própria do catálogo vai de 39 a 78 (recorte de catálogo maior). Citações de página nesta base usam a numeração impressa no rodapé do catálogo, não a posição física no PDF.'),
(3, 1, 'Catálogo Técnico UNNION', 'b1c69ea5-unnionresumidositecompressed_1.pdf', 'https://alconort.com.br/wp-content/uploads/2023/09/unnion-resumido-site-compressed.pdf', '4ª Edição - Junho 2023', 'CATALOGO', 1, 32,
 'Numeração impressa própria do catálogo vai de 37 a 65 (recorte de catálogo maior). Citações de página nesta base usam a numeração impressa no rodapé do catálogo, não a posição física no PDF.'),
(4, 3, 'Catálogo de Perfis Tec-Vidro Suprema', 'cb670e28-CataogoPerfisTecSup.pdf', NULL, NULL, 'CATALOGO', 1, 10,
 'PENDENTE DE EXTRAÇÃO: upload recebido, mas a extração estruturada (agent) falhou por limite de sessão antes de salvar resultado. Repetir extração antes de cadastrar perfis SU/P-xxxx.'),
(5, 2, 'Gold III - Perfis e Acessórios (parte 1)', 'fd91875a-Gold_III_Perfis_Acessorios.pdf', NULL, NULL, 'CATALOGO', 1, 49, 'PENDENTE DE EXTRAÇÃO (ver nota da fonte 4). Imagens de página já exportadas em docs/assets/gold-iii/.'),
(6, 2, 'Gold III - Perfis e Acessórios (parte 2)', '0507a4bf-Gold_III_Perfis_Acessorios_2.pdf', NULL, NULL, 'CATALOGO', 1, 37, 'PENDENTE DE EXTRAÇÃO (ver nota da fonte 4). Imagens de página já exportadas em docs/assets/gold-iii/.'),
(7, 2, 'Gold III - Perfis e Acessórios (parte 3)', '5d03514a-Gold_III_Perfis_Acessorios_1.pdf', NULL, NULL, 'CATALOGO', 1, 7, 'PENDENTE DE EXTRAÇÃO (ver nota da fonte 4).'),
(8, 5, 'Esquadrias de Alumínio: como especificar, comprar e conservar', 'ffd61d31-815612377esquadriasaluminio.pdf', NULL, NULL, 'LIVRO_TECNICO', 1, 52,
 'Guia técnico geral Hydro Building Systems (2004): normas brasileiras, especificação, inspeção, conservação, manutenção, garantia.'),
(9, NULL, 'Tipos de Esquadria de Alumínio (CEHOP 1.10.02)', 'c8b6b6a9-195477202TiposdeEsquadriadeAluminio.pdf', NULL, NULL, 'LIVRO_TECNICO', 1, 8,
 'Especificação técnica CEHOP (Companhia Estadual de Habitação e Obras Públicas) sobre tipos de janela e vantagens/desvantagens.');

-- Product lines
INSERT INTO product_lines (id, manufacturer_id, name, code, description, origin_type, status_code) VALUES
(1, 1, 'Ecoline 2.5', 'ECOLINE25', 'Linha de esquadrias convencionais, bitola 25mm.', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO'),
(2, 1, 'Ecoline 2.5 SGT/GTS', 'ECOLINE25GTS', 'Sub-sistema de vidro colado com fita VHB, montagem a 90°, bitola 25mm, mesmos componentes do Ecoline 2.5.', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO'),
(3, 1, 'UNNION', 'UNNION', 'Linha de esquadrias convencionais Perfil Alumínio do Brasil.', 'ENCONTRADO_DOCUMENTO', 'CATALOGADO'),
(4, 4, 'Asa Flex', 'ASAFLEX', 'Sistema de referência do Livro 5 de Serralheria: montagem a 45° com conexão Flex parafusada (sem macho e cunha).', 'ENCONTRADO_DOCUMENTO', 'REFERENCIA'),
(5, 2, 'Gold III', 'GOLDIII', 'Linha Gold, perfis e acessórios. Aguardando extração de catálogo.', 'NAO_INFORMADO', 'PENDENTE'),
(6, 3, 'Suprema', 'SUPREMA', 'Linha Suprema Tec-Vidro (perfis SU / P-1249 a P-1288). Aguardando extração de catálogo.', 'NAO_INFORMADO', 'PENDENTE');
