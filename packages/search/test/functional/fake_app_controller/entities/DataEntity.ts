import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity()
export class DataEntity {

  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  text: string;

  @Column()
  someNumber: number;

  @Column()
  date: Date;

  @Column()
  enabled: boolean;

}
