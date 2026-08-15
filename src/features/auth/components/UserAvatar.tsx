import type { User } from 'firebase/auth'

type UserAvatarProps = {
  user: User | null
  className: string
}

function UserAvatar({ user, className }: UserAvatarProps) {
  const name = user?.displayName ?? user?.email ?? 'Mi cuenta'
  const initial = (user?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase()
  const title = user?.email ? `${name} · ${user.email}` : name

  if (user?.photoURL) {
    return <img src={user.photoURL} alt={name} title={title} referrerPolicy="no-referrer" className={className} />
  }

  return (
    <span className={className} title={title} aria-hidden="true">
      {initial}
    </span>
  )
}

export default UserAvatar
