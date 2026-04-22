import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("CampaignBulkUpdates", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      campaignId: {
        type: DataTypes.INTEGER,
        references: { model: "Campaigns", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      userName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      newStatus: {
        type: DataTypes.STRING,
        allowNull: false
      },
      shippingIds: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: []
      },
      successCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      failedCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      source: {
        type: DataTypes.STRING,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    }).then(() =>
      queryInterface.addIndex("CampaignBulkUpdates", ["campaignId", "createdAt"], {
        name: "campaign_bulk_updates_campaign_created_idx"
      })
    );
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("CampaignBulkUpdates");
  }
};
