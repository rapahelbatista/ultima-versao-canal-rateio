import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Webhooks de eventos de campanha (entregue/lido/respondido/falhou)
    await queryInterface.createTable("CampaignWebhooks", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      url: {
        type: DataTypes.STRING(2048),
        allowNull: false
      },
      // Lista de eventos: ['sent','delivered','read','replied','failed']
      events: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: ["sent", "delivered", "read", "replied", "failed"]
      },
      secret: {
        type: DataTypes.STRING,
        allowNull: true
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      // null = todos as campanhas; ou específico
      campaignId: {
        type: DataTypes.INTEGER,
        references: { model: "Campaigns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: true
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("CampaignWebhooks", ["companyId"]);
    await queryInterface.addIndex("CampaignWebhooks", ["campaignId"]);

    // Log de entregas dos webhooks (para retry/debug)
    await queryInterface.createTable("CampaignWebhookDeliveries", {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      webhookId: {
        type: DataTypes.INTEGER,
        references: { model: "CampaignWebhooks", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      event: { type: DataTypes.STRING, allowNull: false },
      payload: { type: DataTypes.JSONB, allowNull: false },
      responseStatus: { type: DataTypes.INTEGER, allowNull: true },
      responseBody: { type: DataTypes.TEXT, allowNull: true },
      attempt: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
      success: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      deliveredAt: { type: DataTypes.DATE, allowNull: true },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("CampaignWebhookDeliveries", ["webhookId", "createdAt"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("CampaignWebhookDeliveries");
    await queryInterface.dropTable("CampaignWebhooks");
  }
};
