const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins')

const PROVIDER = 'com.codeurdivoire.widget.WatchlistGlanceReceiver'

function withWidgetWatchlist(config, props) {
  const baseUrl = (props && props.baseUrl) || ''
  const apiKey = (props && props.apiKey) || ''

  if (!baseUrl || !apiKey) {
    throw new Error(
      'widget-watchlist plugin: missing required props baseUrl and/or apiKey. ' +
        'Set BACKEND_URL and BACKEND_API_KEY before running expo prebuild.'
    )
  }

  return withAndroidManifest(config, async (cfg) => {
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults)

    application.receiver = application.receiver ?? []
    const existing = application.receiver.find((r) => r.$['android:name'] === PROVIDER)
    if (!existing) {
      application.receiver.push({
        $: {
          'android:name': PROVIDER,
          'android:exported': 'false',
        },
        'intent-filter': [
          {
            action: [{ $: { 'android:name': 'android.appwidget.action.APPWIDGET_UPDATE' } }],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/widget_watchlist_info',
            },
          },
        ],
      })
    }

    application['meta-data'] = application['meta-data'] ?? []
    const setMeta = (name, value) => {
      application['meta-data'] = application['meta-data'].filter(
        (m) => m.$['android:name'] !== name
      )
      application['meta-data'].push({
        $: { 'android:name': name, 'android:value': value },
      })
    }
    setMeta('widget.api.baseUrl', baseUrl)
    setMeta('widget.api.key', apiKey)

    return cfg
  })
}

module.exports = withWidgetWatchlist
