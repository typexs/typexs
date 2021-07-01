import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity()
export class SearchEntity {

  @PrimaryColumn()
  id: number;

  @Column()
  search: string;

  @Column()
  textus: string;

  @Column()
  numerus: number;

  @Column()
  datus: Date;

  @Column()
  enabled: boolean;

}
