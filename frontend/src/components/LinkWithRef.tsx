import { forwardRef } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

/** Обёртка над `Link` с `forwardRef` для совместимости с измерениями DOM / фокусом. */
export const LinkWithRef = forwardRef<HTMLAnchorElement, LinkProps>(function LinkWithRef(props, ref) {
  return <Link ref={ref} {...props} />
})
