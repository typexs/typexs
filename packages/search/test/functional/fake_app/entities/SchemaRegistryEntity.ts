import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity()
export class SchemaRegistryEntity {

  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

}
