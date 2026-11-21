import Image from 'next/image'

export function AppIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <Image
      className={className ? `app-icon ${className}` : 'app-icon'}
      src="/icon.png"
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
    />
  )
}
