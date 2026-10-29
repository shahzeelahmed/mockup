import frappeUIPreset, { content as frappeUIContent } from 'frappe-ui/tailwind'

const crmSrc = process.env.CRM_SRC

export default {
  presets: [frappeUIPreset],
  content: [
    `${process.env.MOCKUP_DIR}/**/*.{vue,js}`,
    `${crmSrc}/components/**/*.{vue,js}`,
    `${crmSrc}/pages/**/*.{vue,js}`,
    ...frappeUIContent,
    // EXTRA_CONTENT: comma-separated globs, e.g. a local frappe-ui checkout's src
    ...(process.env.EXTRA_CONTENT ? process.env.EXTRA_CONTENT.split(',') : []),
  ],
}
