import { QueryInterface } from "sequelize";

/**
 * Reforço multi-tenant para Warmer e Meta Template Builder.
 * - Índices compostos por companyId para listagem/filtragem rápida
 * - Unicidade por (companyId, name) onde faz sentido (rascunhos/templates)
 * - Garante CASCADE coerente nas FKs de companyId
 *
 * Idempotente: usa IF NOT EXISTS / DO blocks para rodar com segurança.
 */
module.exports = {
  up: async (queryInterface: QueryInterface) => {
    const sequelize = queryInterface.sequelize;

    // ===== Índices compostos =====
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_warmer_settings_company"
        ON "WarmerSettings" ("companyId");

      CREATE INDEX IF NOT EXISTS "idx_warmer_drafts_company_updated"
        ON "WarmerDrafts" ("companyId", "updatedAt" DESC);

      CREATE INDEX IF NOT EXISTS "idx_warmer_versions_company_created"
        ON "WarmerVersions" ("companyId", "createdAt" DESC);

      CREATE INDEX IF NOT EXISTS "idx_meta_templates_company_status"
        ON "MetaTemplates" ("companyId", "status");

      CREATE INDEX IF NOT EXISTS "idx_meta_templates_company_updated"
        ON "MetaTemplates" ("companyId", "updatedAt" DESC);

      CREATE INDEX IF NOT EXISTS "idx_meta_template_versions_template_created"
        ON "MetaTemplateVersions" ("templateId", "createdAt" DESC);

      CREATE INDEX IF NOT EXISTS "idx_meta_template_versions_company"
        ON "MetaTemplateVersions" ("companyId");
    `);

    // ===== Unicidade por tenant =====
    // Rascunhos do warmer: nome único por empresa
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uniq_warmer_drafts_company_name"
        ON "WarmerDrafts" ("companyId", "name");
    `);

    // Templates da Meta: nome único por empresa (Meta exige nome único globalmente,
    // mas dentro do nosso sistema garantimos por tenant para evitar duplicatas locais)
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uniq_meta_templates_company_name"
        ON "MetaTemplates" ("companyId", "name");
    `);

    // Garante exatamente uma linha de WarmerSettings por empresa
    await sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uniq_warmer_settings_company"
        ON "WarmerSettings" ("companyId");
    `);
  },

  down: async (queryInterface: QueryInterface) => {
    const sequelize = queryInterface.sequelize;
    await sequelize.query(`
      DROP INDEX IF EXISTS "idx_warmer_settings_company";
      DROP INDEX IF EXISTS "idx_warmer_drafts_company_updated";
      DROP INDEX IF EXISTS "idx_warmer_versions_company_created";
      DROP INDEX IF EXISTS "idx_meta_templates_company_status";
      DROP INDEX IF EXISTS "idx_meta_templates_company_updated";
      DROP INDEX IF EXISTS "idx_meta_template_versions_template_created";
      DROP INDEX IF EXISTS "idx_meta_template_versions_company";
      DROP INDEX IF EXISTS "uniq_warmer_drafts_company_name";
      DROP INDEX IF EXISTS "uniq_meta_templates_company_name";
      DROP INDEX IF EXISTS "uniq_warmer_settings_company";
    `);
  }
};
