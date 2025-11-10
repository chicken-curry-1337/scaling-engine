import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { WishEntity } from '../../wishes/entities/wish.entity';
import { AppBaseEntity } from '../../common/app-base.entity';

@Entity('wishlists')
export class WishlistEntity extends AppBaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  image?: string | null;

  @Index()
  @ManyToOne(() => UserEntity, (u) => u.wishlists, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  owner: UserEntity;

  @ManyToMany(() => WishEntity, (w) => w.wishlists, { cascade: false })
  @JoinTable({
    name: 'wishlist_items',
    joinColumn: { name: 'wishlistId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'wishId', referencedColumnName: 'id' },
  })
  items: WishEntity[];
}
