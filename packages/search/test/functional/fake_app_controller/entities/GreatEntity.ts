import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity()
export class GreatEntity {

  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

}
