import { Link } from 'react-router-dom'
import logo from '@/assets/logo.png'
import { cn } from '@/lib/utils'

type BrandLogoProps = {
  to?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  textClassName?: string
  className?: string
  imgClassName?: string
}

const SIZE = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
  xl: 'h-20 w-20',
}

/** Shared IlmaCader mark — always uses src/assets/logo.png */
export function BrandLogo({
  to = '/',
  size = 'md',
  showText = true,
  textClassName,
  className,
  imgClassName,
}: BrandLogoProps) {
  const content = (
    <>
      <img
        src={logo}
        alt="IlmaCader"
        className={cn(
          'shrink-0 rounded-md object-contain',
          SIZE[size],
          imgClassName,
        )}
      />
      {showText ? (
        <span className={cn('font-bold tracking-tight', textClassName)}>IlmaCader</span>
      ) : null}
    </>
  )

  if (!to) {
    return <div className={cn('inline-flex items-center gap-3', className)}>{content}</div>
  }

  return (
    <Link to={to} className={cn('inline-flex items-center gap-3', className)}>
      {content}
    </Link>
  )
}

export { logo as brandLogoSrc }
