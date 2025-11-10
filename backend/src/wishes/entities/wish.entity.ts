import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  ManyToMany,
  Index,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { Offer } from '../../offers/entities/offer.entity';
import { WishlistEntity } from '../../wishlists/entities/wishlist.entity';
import { AppBaseEntity } from '../../common/app-base.entity';

const numericTransformer = {
  to: (value?: number | null) => value,
  from: (value?: string | null) => (value == null ? null : parseFloat(value)),
};

@Entity('wishes')
export class WishEntity extends AppBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  link?: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  image?: string | null;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    transformer: numericTransformer,
  })
  price: number;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  description?: string | null;

  @Column({ type: 'int', default: 0 })
  copied: number;

  @Index()
  @ManyToOne(() => UserEntity, (u) => u.wishes, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  owner: UserEntity;

  @OneToMany(() => Offer, (o) => o.wish, { cascade: false })
  offers: Offer[];

  @ManyToMany(() => WishlistEntity, (wl) => wl.items, { cascade: false })
  wishlists: WishlistEntity[];
}
