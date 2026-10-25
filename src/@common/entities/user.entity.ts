import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  UpdateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  JoinTable,
  ManyToMany,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn('identity', { generatedIdentity: 'ALWAYS' })
  id!: number;

  @Column('varchar', { length: 255 })
  name!: string;

  @Column('varchar', { length: 255, unique: true })
  email!: string;

  @Column('varchar', { length: 255 })
  passwordHash!: string;

  @JoinTable()
  @ManyToMany(() => Role, (role: Role) => role.users)
  roles!: Role[];

  @CreateDateColumn({ type: 'timestamptz'})
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz'})
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz'})
  deletedAt!: Date;
}