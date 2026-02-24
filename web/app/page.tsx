import {sanityClient} from '@/lib/sanity.client'
import {siteSettingsQuery} from '@/lib/queries'
import MenuExperience from '@/components/MenuExperience'

export default async function Page() {
  const settings = await sanityClient.fetch(siteSettingsQuery)
  return <MenuExperience settings={settings} />
}