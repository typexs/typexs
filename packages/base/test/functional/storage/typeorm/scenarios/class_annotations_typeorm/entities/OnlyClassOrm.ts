import { Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Using typeorm
 */
@Entity()
export class OnlyClassOrm {

  @PrimaryGeneratedColumn()
  id: number;

}
