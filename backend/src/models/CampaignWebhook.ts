import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
  Default,
  AllowNull,
  DataType
} from "sequelize-typescript";

import Company from "./Company";
import Campaign from "./Campaign";

@Table({ tableName: "CampaignWebhooks" })
class CampaignWebhook extends Model<CampaignWebhook> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING(2048))
  url: string;

  @Default(["sent", "delivered", "read", "replied", "failed"])
  @Column(DataType.JSONB)
  events: string[];

  @Column
  secret: string;

  @Default(true)
  @Column
  isActive: boolean;

  @ForeignKey(() => Campaign)
  @Column
  campaignId: number;

  @BelongsTo(() => Campaign)
  campaign: Campaign;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default CampaignWebhook;
