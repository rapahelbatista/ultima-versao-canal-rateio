import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Aquecimento de chip (warmup) — agenda automática que troca mensagens entre números próprios
    await queryInterface.createTable("WarmupSessions", {
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
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "INATIVA"
        // INATIVA | ATIVA | PAUSADA | CONCLUIDA
      },
      // Lista de WhatsAppIds participantes (mínimo 2)
      whatsappIds: {
        type: DataTypes.JSONB,
        allowNull: false
      },
      // Mensagens humanizadas a serem trocadas
      messages: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      // Quantidade alvo de mensagens por dia
      dailyTarget: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30
      },
      // Curva progressiva (ex: 10,20,30,...)
      progressionCurve: {
        type: DataTypes.JSONB,
        allowNull: true
      },
      sentToday: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      lastResetAt: {
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
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("WarmupSessions", ["companyId", "status"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("WarmupSessions");
  }
};
