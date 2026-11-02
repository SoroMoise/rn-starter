const { withGradleProperties } = require('@expo/config-plugins')

const JVM_ARGS = '-Xmx4096m -XX:MaxMetaspaceSize=1024m'

function withGradleMemory(config) {
  return withGradleProperties(config, (mod) => {
    const jvmArgs = mod.modResults.find(
      (item) => item.type === 'property' && item.key === 'org.gradle.jvmargs'
    )

    if (jvmArgs) {
      jvmArgs.value = JVM_ARGS
    } else {
      mod.modResults.push({ type: 'property', key: 'org.gradle.jvmargs', value: JVM_ARGS })
    }

    return mod
  })
}

module.exports = withGradleMemory
