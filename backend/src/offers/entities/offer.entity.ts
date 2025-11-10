import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { WishEntity } from '../../wishes/entities/wish.entity';
import { AppBaseEntity } from '../../common/app-base.entity';

export enum OfferStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

const numericTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value == null ? null : parseFloat(value)),
};

@Entity('offers')
export class Offer extends AppBaseEntity {
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  amount: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  hidden: boolean;

  @Column({
    type: 'enum',
    enum: OfferStatus,
    default: OfferStatus.ACTIVE,
  })
  status: OfferStatus;

  @Index()
  @ManyToOne(() => UserEntity, (u) => u.offers, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  user: UserEntity;

  @Index()
  @ManyToOne(() => WishEntity, (w) => w.offers, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  wish: WishEntity;
}
