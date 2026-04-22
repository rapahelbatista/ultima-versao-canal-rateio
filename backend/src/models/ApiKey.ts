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
import User from "./User";

@Table({ tableName: "ApiKeys" })
class ApiKey extends Model<ApiKey> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  name: string;

  @AllowNull(false)
  @Column
  keyPrefix: string;

  @AllowNull(false)
  @Column
  keyHash: string;

  @Default([])
  @Column(DataType.JSONB)
  scopes: string[];

  @Default(true)
  @Column
  isActive: boolean;

  @Column
  lastUsedAt: Date;

  @Column
  expiresAt: Date;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @ForeignKey(() => User)
  @Column
  createdBy: number;

  @BelongsTo(() => User)
  creator: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default ApiKey;
