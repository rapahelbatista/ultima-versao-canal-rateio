import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Recursos avançados de campanha
    await queryInterface.addColumn("Campaigns", "useSpintax", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn("Campaigns", "validateNumbers", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });
    await queryInterface.addColumn("Campaigns", "minDelaySeconds", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 5
    });
    await queryInterface.addColumn("Campaigns", "maxDelaySeconds", {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 25
    });
    // Multi-chip: lista de WhatsAppIds em JSON (ex: [1,4,7])
    await queryInterface.addColumn("Campaigns", "whatsappIds", {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    });
    // Janela de envio (horário comercial). JSON: {start:"08:00",end:"18:00",days:[1,2,3,4,5]}
    await queryInterface.addColumn("Campaigns", "sendWindow", {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null
    });
    // Pausa a cada N mensagens por M segundos
    await queryInterface.addColumn("Campaigns", "batchSize", {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    });
    await queryInterface.addColumn("Campaigns", "batchPauseSeconds", {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("Campaigns", "useSpintax");
    await queryInterface.removeColumn("Campaigns", "validateNumbers");
    await queryInterface.removeColumn("Campaigns", "minDelaySeconds");
    await queryInterface.removeColumn("Campaigns", "maxDelaySeconds");
    await queryInterface.removeColumn("Campaigns", "whatsappIds");
    await queryInterface.removeColumn("Campaigns", "sendWindow");
    await queryInterface.removeColumn("Campaigns", "batchSize");
    await queryInterface.removeColumn("Campaigns", "batchPauseSeconds");
  }
};
