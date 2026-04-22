import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("WarmerSettings", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      // Lista de mensagens humanizadas usadas pelo aquecedor
      messages: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      // Parâmetros: minIntervalSec, maxIntervalSec, dailyLimit, startTime, endTime
      config: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false,
        unique: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("WarmerSettings");
  }
};
