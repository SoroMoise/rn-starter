import { useEffect, useState } from 'react'
import { Keyboard, Platform } from 'react-native'

export function useKeyboardHeight({ enabled }: { enabled: boolean }): number {
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setHeight(0)
      return
    }

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
