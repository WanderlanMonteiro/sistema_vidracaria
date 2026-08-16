-- 0001_core_technical.sql
-- Núcleo técnico: fabricantes, linhas, fontes, perfis, acessórios, vidros, guarnições,
-- persianas, tipologias e limites dimensionais/estruturais/pressão.
--
-- Convenção de governança repetida nas tabelas de fato técnico:
--   origin_type       -> como o dado chegou ao sistema (seção 2 do briefing)
--   status_code       -> estágio de governança (seção 11 do briefing)
--   source_reference_id -> citação exata (fonte + página) que originou o dado

CREATE TABLE manufacturers (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  legal_name  VARCHAR(200) NULL,
  website     VARCHAR(255) NULL,
  notes       TEXT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_manufacturers_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE technical_sources (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  manufacturer_id BIGINT UNSIGNED NULL,
  title           VARCHAR(255) NOT NULL,
  file_name       VARCHAR(255) NULL,
  source_url      VARCHAR(500) NULL,
  edition         VARCHAR(60) NULL,
  document_type   ENUM('CATALOGO','LIVRO_TECNICO','PLANILHA','DESENHO','OUTRO') NOT NULL DEFAULT 'OUTRO',
  is_uploaded     TINYINT(1) NOT NULL DEFAULT 0,
  page_count      INT NULL,
  notes           TEXT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_technical_sources_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE source_references (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  technical_source_id BIGINT UNSIGNED NOT NULL,
  page_number         INT NULL,
  page_range          VARCHAR(20) NULL,
  section_title       VARCHAR(200) NULL,
  excerpt             TEXT NULL,
  extracted_by        VARCHAR(120) NULL,
  extracted_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_source_references_source FOREIGN KEY (technical_source_id) REFERENCES technical_sources(id),
  KEY idx_source_references_source (technical_source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE product_lines (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  manufacturer_id     BIGINT UNSIGNED NOT NULL,
  name                VARCHAR(120) NOT NULL,
  code                VARCHAR(40) NULL,
  bitola_mm           DECIMAL(8,2) NULL,
  description         TEXT NULL,
  origin_type         ENUM('ENCONTRADO_DOCUMENTO','EXTRAIDO_DESENHO','INTERPRETADO','DERIVADO_CALCULO','NAO_INFORMADO') NOT NULL DEFAULT 'NAO_INFORMADO',
  status_code         VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id BIGINT UNSIGNED NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_product_lines_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id),
  CONSTRAINT fk_product_lines_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_product_lines_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id),
  UNIQUE KEY uk_product_lines_manufacturer_name (manufacturer_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE profiles (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  manufacturer_id     BIGINT UNSIGNED NOT NULL,
  product_line_id     BIGINT UNSIGNED NULL,
  code                VARCHAR(30) NOT NULL,
  name                VARCHAR(180) NULL,
  category            VARCHAR(60) NULL COMMENT 'MARCO, FOLHA, BAGUETE, CONTRAMARCO, ARREMATE, MAO_DE_AMIGO, FLEX, TRAVAMENTO, VENEZIANA, GUIA, OUTRO',
  weight_kg_per_m     DECIMAL(10,4) NULL,
  description         TEXT NULL,
  origin_type         ENUM('ENCONTRADO_DOCUMENTO','EXTRAIDO_DESENHO','INTERPRETADO','DERIVADO_CALCULO','NAO_INFORMADO') NOT NULL DEFAULT 'NAO_INFORMADO',
  status_code         VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id BIGINT UNSIGNED NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profiles_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id),
  CONSTRAINT fk_profiles_product_line FOREIGN KEY (product_line_id) REFERENCES product_lines(id),
  CONSTRAINT fk_profiles_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_profiles_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id),
  -- Únicidade por linha de produto, não por fabricante: peças genéricas (conexões,
  -- contramarcos, arremates) aparecem catalogadas com o mesmo código em mais de uma
  -- linha do mesmo fabricante (ex: CL-006 existe tanto no catálogo Ecoline 2.5 quanto
  -- no UNNION, ambos Perfil Alumínio do Brasil) — tratamos como registros distintos
  -- por linha, já que cada catálogo é a fonte citada separadamente.
  UNIQUE KEY uk_profiles_line_code (manufacturer_id, product_line_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE profile_dimensions (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id          BIGINT UNSIGNED NOT NULL,
  dimension_name      VARCHAR(60) NOT NULL COMMENT 'ex: largura_visivel_mm, altura_mm, espessura_parede_mm',
  value_mm            DECIMAL(10,3) NULL,
  origin_type         ENUM('ENCONTRADO_DOCUMENTO','EXTRAIDO_DESENHO','INTERPRETADO','DERIVADO_CALCULO','NAO_INFORMADO') NOT NULL DEFAULT 'NAO_INFORMADO',
  status_code         VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_profile_dimensions_profile FOREIGN KEY (profile_id) REFERENCES profiles(id),
  CONSTRAINT fk_profile_dimensions_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_profile_dimensions_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id),
  KEY idx_profile_dimensions_profile (profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE profile_applications (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id          BIGINT UNSIGNED NOT NULL,
  application         VARCHAR(150) NOT NULL COMMENT 'ex: janela de correr 2 planos, peitoril, bandeira',
  notes               TEXT NULL,
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_profile_applications_profile FOREIGN KEY (profile_id) REFERENCES profiles(id),
  CONSTRAINT fk_profile_applications_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id),
  KEY idx_profile_applications_profile (profile_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE profile_connections (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id_a        BIGINT UNSIGNED NOT NULL,
  profile_id_b        BIGINT UNSIGNED NOT NULL,
  connection_type     VARCHAR(80) NULL COMMENT 'ex: encaixe click, parafusado, macho-cunha, flex',
  notes               TEXT NULL,
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_profile_connections_a FOREIGN KEY (profile_id_a) REFERENCES profiles(id),
  CONSTRAINT fk_profile_connections_b FOREIGN KEY (profile_id_b) REFERENCES profiles(id),
  CONSTRAINT fk_profile_connections_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compatibilidade só é marcada is_explicit=1 quando documentada literalmente na fonte.
-- Nunca inferir compatibilidade entre linhas por semelhança de código (ex: Ecoline x UNNION).
CREATE TABLE profile_compatibilities (
  id                            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  profile_id                    BIGINT UNSIGNED NOT NULL,
  compatible_with_profile_id    BIGINT UNSIGNED NULL,
  compatible_with_manufacturer_id BIGINT UNSIGNED NULL,
  glass_type_id                 BIGINT UNSIGNED NULL,
  is_explicit                   TINYINT(1) NOT NULL DEFAULT 0,
  notes                         TEXT NULL,
  source_reference_id           BIGINT UNSIGNED NULL,
  CONSTRAINT fk_profile_compat_profile FOREIGN KEY (profile_id) REFERENCES profiles(id),
  CONSTRAINT fk_profile_compat_other_profile FOREIGN KEY (compatible_with_profile_id) REFERENCES profiles(id),
  CONSTRAINT fk_profile_compat_manufacturer FOREIGN KEY (compatible_with_manufacturer_id) REFERENCES manufacturers(id),
  CONSTRAINT fk_profile_compat_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE profile_variants (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  base_profile_id     BIGINT UNSIGNED NOT NULL,
  variant_code        VARCHAR(30) NOT NULL,
  variant_description TEXT NULL,
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_profile_variants_base FOREIGN KEY (base_profile_id) REFERENCES profiles(id),
  CONSTRAINT fk_profile_variants_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE accessories (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  manufacturer_id     BIGINT UNSIGNED NOT NULL,
  code                VARCHAR(30) NOT NULL,
  name                VARCHAR(180) NULL,
  category            VARCHAR(60) NULL COMMENT 'FECHO, ROLDANA, DOBRADICA, BRACO, PUXADOR, GAXETA, ESCOVA, CHUMBADOR, OUTRO',
  description         TEXT NULL,
  origin_type         ENUM('ENCONTRADO_DOCUMENTO','EXTRAIDO_DESENHO','INTERPRETADO','DERIVADO_CALCULO','NAO_INFORMADO') NOT NULL DEFAULT 'NAO_INFORMADO',
  status_code         VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id BIGINT UNSIGNED NULL,
  created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_accessories_manufacturer FOREIGN KEY (manufacturer_id) REFERENCES manufacturers(id),
  CONSTRAINT fk_accessories_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_accessories_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id),
  UNIQUE KEY uk_accessories_manufacturer_code (manufacturer_id, code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE accessory_compatibilities (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  accessory_id         BIGINT UNSIGNED NOT NULL,
  profile_id           BIGINT UNSIGNED NULL,
  typology_id          BIGINT UNSIGNED NULL,
  notes                TEXT NULL,
  source_reference_id  BIGINT UNSIGNED NULL,
  CONSTRAINT fk_accessory_compat_accessory FOREIGN KEY (accessory_id) REFERENCES accessories(id),
  CONSTRAINT fk_accessory_compat_profile FOREIGN KEY (profile_id) REFERENCES profiles(id),
  CONSTRAINT fk_accessory_compat_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE glass_types (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(120) NOT NULL,
  thickness_mm        DECIMAL(5,2) NULL,
  glass_category      VARCHAR(40) NULL COMMENT 'SIMPLES, LAMINADO, DUPLO, TEMPERADO',
  notes               TEXT NULL,
  origin_type         ENUM('ENCONTRADO_DOCUMENTO','EXTRAIDO_DESENHO','INTERPRETADO','DERIVADO_CALCULO','NAO_INFORMADO') NOT NULL DEFAULT 'NAO_INFORMADO',
  status_code         VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_glass_types_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_glass_types_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE gaskets (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code                VARCHAR(30) NOT NULL,
  material            VARCHAR(40) NOT NULL DEFAULT 'EPDM',
  profile_id          BIGINT UNSIGNED NULL,
  glass_min_mm        DECIMAL(5,2) NULL,
  glass_max_mm        DECIMAL(5,2) NULL,
  position             ENUM('INTERNA','EXTERNA') NULL,
  notes               TEXT NULL,
  origin_type         ENUM('ENCONTRADO_DOCUMENTO','EXTRAIDO_DESENHO','INTERPRETADO','DERIVADO_CALCULO','NAO_INFORMADO') NOT NULL DEFAULT 'NAO_INFORMADO',
  status_code         VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_gaskets_profile FOREIGN KEY (profile_id) REFERENCES profiles(id),
  CONSTRAINT fk_gaskets_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_gaskets_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE brushes (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code                VARCHAR(30) NOT NULL,
  width_mm            DECIMAL(5,2) NULL,
  has_pile            TINYINT(1) NULL,
  notes               TEXT NULL,
  status_code         VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_brushes_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_brushes_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fita VHB (Ecoline SGT): largura/recuo/folga NÃO documentados no material disponível.
-- Campos ficam NULL + status PENDENTE até confirmação em fonte real (regra da seção 4).
CREATE TABLE tapes (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code                VARCHAR(30) NOT NULL,
  tape_type           VARCHAR(40) NOT NULL COMMENT 'ex: VHB',
  width_mm            DECIMAL(6,2) NULL,
  setback_mm          DECIMAL(6,2) NULL COMMENT 'recuo',
  clearance_mm        DECIMAL(6,2) NULL COMMENT 'folga',
  notes               TEXT NULL,
  status_code         VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_tapes_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_tapes_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shutters (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  code                VARCHAR(30) NULL COMMENT 'veneziana',
  height_mm           DECIMAL(6,2) NULL,
  notes               TEXT NULL,
  status_code         VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_shutters_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_shutters_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE blinds (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_line_id     BIGINT UNSIGNED NULL,
  height_mm           DECIMAL(6,2) NOT NULL COMMENT 'ex: 120, 140, 190',
  guide_type          ENUM('CLICK','PARAFUSADA') NULL,
  shaft_type          VARCHAR(40) NULL COMMENT 'ex: eixo octogonal 40mm, eixo octogonal 60mm',
  shaft_profile_code  VARCHAR(30) NULL,
  max_width_mm        DECIMAL(8,2) NULL,
  notes               TEXT NULL,
  status_code         VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_blinds_product_line FOREIGN KEY (product_line_id) REFERENCES product_lines(id),
  CONSTRAINT fk_blinds_status FOREIGN KEY (status_code) REFERENCES data_status(status_code),
  CONSTRAINT fk_blinds_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE typologies (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name                VARCHAR(120) NOT NULL,
  category            VARCHAR(40) NOT NULL COMMENT 'CORRER, GIRO, MAXIM_AR, OSCILOBATENTE, PIVOTANTE, RIBANTA, CAMARAO, GUILHOTINA, BASCULANTE',
  has_baguete         TINYINT(1) NULL,
  is_common_in_brazil TINYINT(1) NOT NULL DEFAULT 1,
  notes               TEXT NULL,
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_typologies_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id),
  UNIQUE KEY uk_typologies_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE typology_components (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  typology_id         BIGINT UNSIGNED NOT NULL,
  product_line_id     BIGINT UNSIGNED NULL,
  component_role      VARCHAR(60) NOT NULL COMMENT 'MARCO, FOLHA_LARGURA, FOLHA_ALTURA, BAGUETE_LARGURA, BAGUETE_ALTURA, MAO_DE_AMIGO, FLEX, VIDRO, ARREMATE, PINGADEIRA',
  profile_id          BIGINT UNSIGNED NULL,
  quantity            INT NULL,
  cut_angle_deg       DECIMAL(5,2) NULL,
  notes               TEXT NULL,
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_typology_components_typology FOREIGN KEY (typology_id) REFERENCES typologies(id),
  CONSTRAINT fk_typology_components_product_line FOREIGN KEY (product_line_id) REFERENCES product_lines(id),
  CONSTRAINT fk_typology_components_profile FOREIGN KEY (profile_id) REFERENCES profiles(id),
  CONSTRAINT fk_typology_components_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE dimensional_limits (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  subject_type        VARCHAR(40) NOT NULL COMMENT 'BLIND, PRODUCT_LINE, TYPOLOGY',
  subject_id          BIGINT UNSIGNED NOT NULL,
  limit_name          VARCHAR(80) NOT NULL COMMENT 'ex: largura_maxima_mm',
  value_mm            DECIMAL(10,2) NOT NULL,
  notes               TEXT NULL,
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_dimensional_limits_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id),
  KEY idx_dimensional_limits_subject (subject_type, subject_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE structural_limits (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_line_id     BIGINT UNSIGNED NOT NULL,
  description         VARCHAR(255) NOT NULL,
  value_numeric        DECIMAL(14,4) NULL,
  unit                VARCHAR(20) NULL,
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_structural_limits_product_line FOREIGN KEY (product_line_id) REFERENCES product_lines(id),
  CONSTRAINT fk_structural_limits_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE pressure_limits (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_line_id     BIGINT UNSIGNED NOT NULL,
  test_pressure_pa    DECIMAL(10,2) NOT NULL,
  notes               TEXT NULL,
  source_reference_id BIGINT UNSIGNED NULL,
  CONSTRAINT fk_pressure_limits_product_line FOREIGN KEY (product_line_id) REFERENCES product_lines(id),
  CONSTRAINT fk_pressure_limits_source FOREIGN KEY (source_reference_id) REFERENCES source_references(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
