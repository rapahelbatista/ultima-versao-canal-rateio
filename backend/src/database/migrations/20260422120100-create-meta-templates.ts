import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.createTable("MetaTemplates", {
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
      // standard | carousel | catalog
      templateType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "standard"
      },
      language: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pt_BR"
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Utility"
      },
      // Estrutura completa do builder (header/body/footer/buttons/variables/...)
      payload: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {}
      },
      // draft | pending | approved | rejected
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "draft"
      },
      // Mensagem de retorno da Meta (rejeição/observação)
      statusReason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      // Step atual do wizard, para retomar de onde parou
      currentStep: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      createdAt: { type: DataTypes.DATE, allowNull: false },
      updatedAt: { type: DataTypes.DATE, allowNull: false }
    });

    await queryInterface.addIndex("MetaTemplates", ["companyId", "status"]);
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.dropTable("MetaTemplates");
  }
};
