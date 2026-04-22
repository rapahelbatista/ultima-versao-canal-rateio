import {
  Table, Column, CreatedAt, UpdatedAt, Model, PrimaryKey,
  ForeignKey, BelongsTo, AutoIncrement, Default
} from "sequelize-typescript";
import { DataTypes } from "sequelize";
import Company from "./Company";
import MetaTemplate from "./MetaTemplate";

@Table({ tableName: "MetaTemplateVersions" })
class MetaTemplateVersion extends Model<MetaTemplateVersion> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @ForeignKey(() => MetaTemplate)
  @Column
  templateId: number;

  @BelongsTo(() => MetaTemplate)
  template: MetaTemplate;

  @ForeignKey(() => Company)
  @Column
  companyId: number;

  @BelongsTo(() => Company)
  company: Company;

  @Default({})
  @Column(DataTypes.JSONB)
  snapshot: Record<string, unknown>;

  @CreatedAt createdAt: Date;
  @UpdatedAt updatedAt: Date;
}

export default MetaTemplateVersion;
