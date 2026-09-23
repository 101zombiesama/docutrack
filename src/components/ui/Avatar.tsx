/* eslint-disable @next/next/no-img-element -- avatars are user-supplied data URLs */
import { initialsOf, cx } from '@/lib/utils';
import styles from './Avatar.module.css';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}

export function Avatar({ name, src, size = 34, className }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.max(11, size * 0.36) };
  if (src) {
    return (
      <img src={src} alt="" className={cx(styles.avatar, styles.image, className)} style={style} />
    );
  }
  return (
    <span className={cx(styles.avatar, className)} style={style} aria-hidden>
      {initialsOf(name)}
    </span>
  );
}
