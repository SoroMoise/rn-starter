import Image from 'next/image'
import type { Locale } from '@/lib/i18n'
import { SCREENSHOTS } from '@/lib/images'
import { SITE } from '@/lib/site'
import { AppIcon } from './AppIcon'

export function PhoneFrame({ locale }: { locale: Locale }) {
  const screenshot = SCREENSHOTS[0]

  return (
    <div className="phone">
      <div className="phone-screen">
        {screenshot ? (
          <Image
            className="phone-shot"
            src={screenshot.src}
            width={screenshot.width}
            height={screenshot.height}
            alt={screenshot.alt[locale]}
            priority
          />
        ) : (
          <div className="phone-placeholder" aria-hidden="true">
            <AppIcon size={96} />
            <span>{SITE.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
