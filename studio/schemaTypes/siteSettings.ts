import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'titleDe',
      title: 'Accordion Title (DE)',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'servicesDe',
      title: 'Services (DE)',
      type: 'array',
      of: [{type: 'string'}],
      description: 'One line per service',
    }),

    defineField({
      name: 'titleEn',
      title: 'Accordion Title (EN)',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'servicesEn',
      title: 'Services (EN)',
      type: 'array',
      of: [{type: 'string'}],
      description: 'One line per service',
    }),

    defineField({
      name: 'menuLabel',
      title: 'Menu Button Label',
      type: 'string',
      initialValue: 'Menu',
    }),

    defineField({
      name: 'langLabelDe',
      title: 'Lang Button Label (DE)',
      type: 'string',
      initialValue: 'DE: ORIGINALE GRAFISCHE ORDNUNG',
    }),
    defineField({
      name: 'langLabelEn',
      title: 'Lang Button Label (EN)',
      type: 'string',
      initialValue: 'EN: ORIGINAL GRAPHIC ORDER',
    }),

    defineField({
      name: 'contactButtons',
      title: 'Contact Buttons',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'contactButton',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'string',
              description: 'Examples: mailto:hello@ogo.studio, https://instagram.com/..., /impressum',
            }),
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'href',
            },
          },
        },
      ],
      validation: (Rule) => Rule.max(3),
    }),

    defineField({
      name: 'ogoLogo',
      title: 'OGO Logo',
      type: 'image',
      options: {hotspot: true},
    }),

    defineField({
      name: 'logosSvgFile',
      title: 'Accordion Logos SVG',
      type: 'file',
      options: {accept: '.svg'},
    }),
  ],
  preview: {
    prepare() {
      return {title: 'Site Settings'}
    },
  },
})