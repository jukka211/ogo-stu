import {groq} from 'next-sanity'

export const siteSettingsQuery = groq`
*[_type == "siteSettings"][0]{
  titleDe,
  servicesDe,
  titleEn,
  servicesEn,
  menuLabel,
  langLabelDe,
  langLabelEn,
  contactButtons[]{
    label,
    href
  },
  ogoLogo,
  logosSvgFile{
    asset->{
      url
    }
  }
}
`