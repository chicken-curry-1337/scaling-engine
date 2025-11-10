import { Column, Entity, Index, OneToMany } from 'typeorm';
import { WishEntity } from 'src/wishes/entities/wish.entity';
import { WishlistEntity } from 'src/wishlists/entities/wishlist.entity';
import { Offer } from 'src/offers/entities/offer.entity';
import { AppBaseEntity } from '../../common/app-base.entity';

@Entity('users')
export class UserEntity extends AppBaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 64 })
  username: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  avatar?: string | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  about?: string | null;

  @OneToMany(() => WishEntity, (w) => w.owner)
  wishes: WishEntity[];

  @OneToMany(() => WishlistEntity, (wl) => wl.owner)
  wishlists: WishlistEntity[];

  @OneToMany(() => Offer, (o) => o.user)
  offers: Offer[];
}
