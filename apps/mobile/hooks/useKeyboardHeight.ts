import { useEffect, useState } from 'react'
import { Keyboard, Platform } from 'react-native'

// A modal is its own window on Android, and `SOFT_INPUT_ADJUST_RESIZE` no longer resizes one under
// edge-to-edge — so nothing shrinks on its own and `useWindowDimensions` keeps reporting the whole
// screen. The height has to be read off the keyboard itself and subtracted by hand.
export function useKeyboardHeight({ enabled }: { enabled: boolean }): number {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setHeight(0)
      return
    }

    // A keyboard already up when the dialog opens sends no new show event.
    setHeight(Keyboard.isVisible() ? (Keyboard.metrics()?.height ?? 0) : 0)

    const isIOS = Platform.OS === 'ios'

    const shown = Keyboard.addListener(isIOS ? 'keyboardWillShow' : 'keyboardDidShow', (event) =>
      setHeight(event.endCoordinates.height)
    )
    const hidden = Keyboard.addListener(isIOS ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setHeight(0)
    )

    return () => {
      shown.remove()
      hidden.remove()
    }
  }, [enabled])

  return height
}
