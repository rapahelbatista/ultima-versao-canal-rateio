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
  DataType
} from "sequelize-typescript";
import Campaign from "./Campaign";

@Table({ tableName: "CampaignBulkUpdates" })
class CampaignBulkUpdate extends Model<CampaignBulkUpdate> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => Campaign)
  @Column
  campaignId: number;

  @Column
  companyId: number;

  @Column
  userId: number;

  @Column
  userName: string;

  @Column
  newStatus: string;

  @Column(DataType.JSONB)
  shippingIds: number[];

  @Column
  successCount: number;

  @Column
  failedCount: number;

  @Column
  source: string;

  @Column(DataType.JSONB)
  previousState: Array<{
    id: number;
    deliveredAt: string | null;
    confirmedAt: string | null;
    message: string | null;
  }>;

  @Column
  undoneAt: Date;

  @Column
  undoneByUserId: number;

  @Column
  undoneByUserName: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => Campaign)
  campaign: Campaign;
}

export default CampaignBulkUpdate;
