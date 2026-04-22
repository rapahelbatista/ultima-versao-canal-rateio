import {
  Table, Column, CreatedAt, UpdatedAt, Model, PrimaryKey,
  ForeignKey, BelongsTo, AutoIncrement, Default
} from "sequelize-typescript";
import { DataTypes } from "sequelize";
import Company from "./Company";
import User from "./User";

@Table({ tableName: "WarmerDrafts" })
class WarmerDraft extends Model<WarmerDraft> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Default([])
  @Column(DataTypes.JSONB)
  messages: string[];

  @Default({})
  @Column(DataTypes.JSONB)
  config: Record<string, unknown>;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}

export default WarmerDraft;
