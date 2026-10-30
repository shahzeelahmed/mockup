import frappeUIPreset, { content as frappeUIContent } from 'frappe-ui/tailwind'

export default {
  presets: [frappeUIPreset],
  content: [
    `${process.env.MOCKUP_DIR}/**/*.{vue,js}`,
    ...frappeUIContent,
    // EXTRA_CONTENT: comma-separated globs, e.g. a local frappe-ui checkout's src
    ...(process.env.EXTRA_CONTENT ? process.env.EXTRA_CONTENT.split(',') : []),
  ],
}
