import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // API Keys públicas por empresa (API v2)
    await queryInterface.createTable("ApiKeys", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      // Chave em texto (prefixada: ec_live_xxx). Hash separado para validação.
      keyPrefix: {
        type: DataTypes.STRING(16),
        allowNull: false
      },
      keyHash: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true
      },
      // Escopos: ['campaigns:read','campaigns:write','messages:send','contacts:write','webhooks:manage']
      scopes: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      lastUsedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      createdBy: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("ApiKeys", ["companyId", "isActive"]);
    await queryInterface.addIndex("ApiKeys", ["keyHash"], { unique: true });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("ApiKeys");
  }
};
