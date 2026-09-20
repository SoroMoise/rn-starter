package com.yourcompany.appenvironment

import android.provider.Settings
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Play's pre-launch report crawls every upload on Firebase Test Lab devices, tapping whatever the
// hierarchy reports as interactive — ad views included. That traffic is real, non-human and holds no
// test-device identity, so AdMob bills it as invalid. This setting is how such a run announces itself.
private const val TEST_LAB_SETTING = "firebase.test.lab"

class AppEnvironmentModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AppEnvironment")

    Constant("isTestLab") {
      val resolver = appContext.reactContext?.contentResolver
      resolver != null && Settings.System.getString(resolver, TEST_LAB_SETTING) == "true"
    }
  }
}
