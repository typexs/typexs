import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity()
export class RegistryEntity {

  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

}
