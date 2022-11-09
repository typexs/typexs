import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Using typeorm
 */
@Entity()
export class WithJsonOrm {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'json' })
  jsonByDefJson: any;

  @Column()
  jsonByImpObj: object;

  @Column()
  jsonByImpAny: any;


}
