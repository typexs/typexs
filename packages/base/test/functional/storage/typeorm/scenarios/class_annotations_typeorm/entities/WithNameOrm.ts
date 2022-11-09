import { Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Using typeorm
 */
@Entity({name: 'with_special_name'})
export class WithNameOrm {

  @PrimaryGeneratedColumn()
  id: number;

}
