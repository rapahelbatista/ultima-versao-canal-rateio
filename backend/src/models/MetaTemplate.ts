import {
  Table,
  Column,
  CreatedAt,
  UpdatedAt,
  Model,
  PrimaryKey,
  ForeignKey,
  BelongsTo,
  AutoIncrement,
  Default
} from "sequelize-typescript";
import { DataTypes } from "sequelize";
import Company from "./Company";
import User from "./User";

@Table({ tableName: "MetaTemplates" })
class MetaTemplate extends Model<MetaTemplate> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  name: string;

  @Default("standard")
  @Column
  templateType: string;

  @Default("pt_BR")
  @Column
  language: string;

  @Default("Utility")
  @Column
  category: string;

  @Default({})
  @Column(DataTypes.JSONB)
  payload: Record<string, unknown>;

  @Default("draft")
  @Column
  status: string;

  @Column(DataTypes.TEXT)
  statusReason: string;

  @Default(0)
  @Column
  currentStep: number;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;

  @BelongsTo(() => Company)
  company: Company;

  @BelongsTo(() => User)
  user: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}

export default MetaTemplate;
