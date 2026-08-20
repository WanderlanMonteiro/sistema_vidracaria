-- 0001_data_status.sql
-- Domínio fixo de status de governança (seção 11 do briefing técnico).

INSERT INTO data_status (status_code, label, description, blocks_production, sort_order) VALUES
('EXTRAIDO',               'Extraído',                 'Dado copiado literalmente de um documento fonte, com página citada.', 1, 10),
('CATALOGADO',             'Catalogado',                'Dado extraído e organizado na estrutura do sistema, ainda sem revisão técnica.', 1, 20),
('INTERPRETADO',           'Interpretado',              'Dado inferido a partir do documento (ex: leitura de desenho), não copiado literalmente.', 1, 30),
('REFERENCIA',             'Referência técnica',        'Fórmula ou dado registrado como referência, não como regra universal (ex: fórmula de um fabricante específico).', 1, 40),
('PENDENTE',                'Pendente',                  'Dado necessário mas ainda não encontrado em nenhuma fonte confiável.', 1, 50),
('NECESSITA_CONFERENCIA',  'Necessita conferência',     'Dado presente mas com ambiguidade, conflito ou baixa confiança que exige checagem humana.', 1, 60),
('CONFLITANTE',            'Conflitante',               'Duas ou mais fontes (ou seções do mesmo documento) divergem sobre o mesmo dado.', 1, 70),
('VALIDADO',               'Validado',                  'Dado conferido e confirmado por um responsável técnico.', 1, 80),
('PROTOTIPO_PRODUZIDO',    'Protótipo produzido',       'Um protótipo físico foi montado a partir deste dado/fórmula.', 1, 90),
('APROVADO',               'Aprovado',                  'Dado formalmente aprovado por responsável técnico, mas ainda não liberado para produção seriada.', 1, 100),
('LIBERADO_PRODUCAO',      'Liberado para produção',    'Todos os itens do checklist da seção 13 foram atendidos; pode ser usado em produção seriada.', 0, 110),
('BLOQUEADO',              'Bloqueado',                 'Uso suspenso por decisão técnica (ex: erro identificado, não conformidade grave).', 1, 120),
('OBSOLETO',               'Obsoleto',                  'Dado substituído por uma versão mais recente ou descontinuado pelo fabricante.', 1, 130);
