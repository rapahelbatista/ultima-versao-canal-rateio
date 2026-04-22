import {
  Table, Column, CreatedAt, UpdatedAt, Model, PrimaryKey,
  ForeignKey, BelongsTo, AutoIncrement, Default
} from "sequelize-typescript";
import { DataTypes } from "sequelize";
import Company from "./Company";

@Table({ tableName: "WarmerVersions" })
class WarmerVersion extends Model<WarmerVersion> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

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

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}

export default WarmerVersion;
