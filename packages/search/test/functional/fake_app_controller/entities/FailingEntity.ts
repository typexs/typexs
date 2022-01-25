import {Column, Entity, PrimaryColumn} from 'typeorm';

@Entity()
export class FailingEntity {

  @PrimaryColumn()
  id: number;

  @Column()
  dateStr: string;

}
