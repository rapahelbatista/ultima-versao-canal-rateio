import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    await queryInterface.addColumn("CampaignBulkUpdates", "previousState", {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: []
    });
    await queryInterface.addColumn("CampaignBulkUpdates", "undoneAt", {
      type: DataTypes.DATE,
      allowNull: true
    });
    await queryInterface.addColumn("CampaignBulkUpdates", "undoneByUserId", {
      type: DataTypes.INTEGER,
      allowNull: true
    });
    await queryInterface.addColumn("CampaignBulkUpdates", "undoneByUserName", {
      type: DataTypes.STRING,
      allowNull: true
    });
  },

  down: async (queryInterface: QueryInterface) => {
    await queryInterface.removeColumn("CampaignBulkUpdates", "previousState");
    await queryInterface.removeColumn("CampaignBulkUpdates", "undoneAt");
    await queryInterface.removeColumn("CampaignBulkUpdates", "undoneByUserId");
    await queryInterface.removeColumn("CampaignBulkUpdates", "undoneByUserName");
  }
};
