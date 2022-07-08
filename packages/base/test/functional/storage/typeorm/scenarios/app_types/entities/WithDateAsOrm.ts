import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Using schema api
 */
@Entity()
export class WithDateAsOrm {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  dateByImpDate: Date;

  @Column({ type: 'date' })
  dateByType: Date;

  @Column({ type: 'datetime' })
  datetimeByType: Date;

  @CreateDateColumn()
  dateForCreated: Date;

  @UpdateDateColumn()
  dateForUpdated: Date;

}
