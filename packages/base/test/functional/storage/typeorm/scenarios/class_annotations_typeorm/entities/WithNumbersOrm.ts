import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Using typeorm
 */
@Entity()
export class WithNumbersOrm {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint' })
  bigNumberValue1: number;


}
