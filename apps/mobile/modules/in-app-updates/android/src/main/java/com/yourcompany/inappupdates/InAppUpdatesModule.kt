package com.yourcompany.inappupdates

import android.app.Activity
import com.google.android.play.core.appupdate.AppUpdateInfo
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.appupdate.AppUpdateOptions
import com.google.android.play.core.install.InstallException
import com.google.android.play.core.install.InstallStateUpdatedListener
import com.google.android.play.core.install.model.AppUpdateType
import com.google.android.play.core.install.model.InstallStatus
import com.google.android.play.core.install.model.UpdateAvailability
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

private const val INSTALL_STATE_EVENT = "onInstallStateChange"

// Flexible updates only, and nothing installs without the app asking: the restart that
// `completeUpdate` causes kills the process and whatever the user had not saved, so the app
// decides when it runs.
class InAppUpdatesModule : Module() {
  private var manager: AppUpdateManager? = null

  private val installStateListener = InstallStateUpdatedListener { state ->
    sendEvent(INSTALL_STATE_EVENT, mapOf("installStatus" to installStatusName(state.installStatus())))
  }

  private fun managerOrNull(): AppUpdateManager? {
    manager?.let { return it }
    val context = appContext.reactContext ?: return null
    return AppUpdateManagerFactory.create(context).also { manager = it }
  }

  override fun definition() = ModuleDefinition {
    Name("InAppUpdates")

    Events(INSTALL_STATE_EVENT)

    OnStartObserving {
      managerOrNull()?.registerListener(installStateListener)
    }

    OnStopObserving {
      manager?.unregisterListener(installStateListener)
    }

    AsyncFunction("getUpdateInfoAsync") { promise: Promise ->
      val updates = managerOrNull() ?: return@AsyncFunction promise.reject(NO_CONTEXT, null, null)
      updates.appUpdateInfo
        .addOnSuccessListener { info -> promise.resolve(describe(info)) }
        .addOnFailureListener { error -> promise.reject(codeOf(error), error.message, error) }
    }

    AsyncFunction("startFlexibleUpdateAsync") { promise: Promise ->
      val updates = managerOrNull() ?: return@AsyncFunction promise.reject(NO_CONTEXT, null, null)
      updates.appUpdateInfo
        .addOnSuccessListener { info ->
          val activity = appContext.currentActivity
          if (activity == null) {
            promise.reject(NO_ACTIVITY, null, null)
            return@addOnSuccessListener
          }
          if (info.updateAvailability() != UpdateAvailability.UPDATE_AVAILABLE ||
            !info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)
          ) {
            promise.resolve("unavailable")
            return@addOnSuccessListener
          }
          updates.startUpdateFlow(info, activity, AppUpdateOptions.defaultOptions(AppUpdateType.FLEXIBLE))
            .addOnSuccessListener { resultCode ->
              promise.resolve(
                when (resultCode) {
                  Activity.RESULT_OK -> "accepted"
                  Activity.RESULT_CANCELED -> "declined"
                  else -> "failed"
                }
              )
            }
            .addOnFailureListener { error -> promise.reject(codeOf(error), error.message, error) }
        }
        .addOnFailureListener { error -> promise.reject(codeOf(error), error.message, error) }
    }

    AsyncFunction("completeUpdateAsync") { promise: Promise ->
      val updates = managerOrNull() ?: return@AsyncFunction promise.reject(NO_CONTEXT, null, null)
      updates.completeUpdate()
        .addOnSuccessListener { promise.resolve(null) }
        .addOnFailureListener { error -> promise.reject(codeOf(error), error.message, error) }
    }
  }

  private fun describe(info: AppUpdateInfo): Map<String, Any> = mapOf(
    "availability" to when (info.updateAvailability()) {
      UpdateAvailability.UPDATE_AVAILABLE -> "available"
      UpdateAvailability.UPDATE_NOT_AVAILABLE -> "none"
      UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS -> "in_progress"
      else -> "unknown"
    },
    "flexibleAllowed" to info.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE),
    "availableVersionCode" to info.availableVersionCode(),
    "installStatus" to installStatusName(info.installStatus())
  )

  private fun installStatusName(status: Int): String = when (status) {
    InstallStatus.PENDING -> "pending"
    InstallStatus.DOWNLOADING -> "downloading"
    InstallStatus.DOWNLOADED -> "downloaded"
    InstallStatus.INSTALLING -> "installing"
    InstallStatus.INSTALLED -> "installed"
    InstallStatus.FAILED -> "failed"
    InstallStatus.CANCELED -> "canceled"
    else -> "unknown"
  }

  private fun codeOf(error: Exception): String =
    if (error is InstallException) "E_INSTALL_${error.errorCode}" else "E_IN_APP_UPDATE"

  private companion object {
    const val NO_CONTEXT = "E_NO_CONTEXT"
    const val NO_ACTIVITY = "E_NO_ACTIVITY"
  }
}
