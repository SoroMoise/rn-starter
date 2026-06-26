import { Toast, ToastType } from '@/components/ui/Toast'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'

interface ToastParams {
  message: string
  type?: ToastType
  duration?: number
}

interface ToastState {
  visible: boolean
  message: string
  type: ToastType
  duration: number
}

interface ToastContextType {
  showToast: (params: ToastParams) => void
  hideToast: () => void
  registerHost: (id: number) => void
  unregisterHost: (id: number) => void
}

interface ToastStateContextType {
  toastState: ToastState
  topHostId: number
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)
const ToastStateContext = createContext<ToastStateContextType | undefined>(undefined)

// Native modals render in a separate window above the app, so a toast mounted in
// the root tree is hidden behind them. Each modal that wants toasts on top mounts
// a ModalToastViewport, which registers itself as a host. Only the topmost host
// (last registered) renders the toast, so it always sits above the frontmost
// surface and never fires twice.
const ROOT_HOST_ID = 0
let nextHostId = ROOT_HOST_ID + 1

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
    duration: 3000,
  })
  const [hostStack, setHostStack] = useState<number[]>([])

  const showToast = useCallback(({ message, type = 'success', duration = 3000 }: ToastParams) => {
    setToast({ visible: true, message, type, duration })
  }, [])

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, visible: false }))
  }, [])

  const registerHost = useCallback((id: number) => {
    setHostStack((prev) => (prev.includes(id) ? prev : [...prev, id]))
  }, [])

  const unregisterHost = useCallback((id: number) => {
    setHostStack((prev) => prev.filter((h) => h !== id))
  }, [])

  const topHostId = hostStack.length > 0 ? hostStack[hostStack.length - 1] : ROOT_HOST_ID

  const actions = useMemo(
    () => ({ showToast, hideToast, registerHost, unregisterHost }),
    [showToast, hideToast, registerHost, unregisterHost]
  )
  const state = useMemo(() => ({ toastState: toast, topHostId }), [toast, topHostId])

  return (
    <ToastContext.Provider value={actions}>
      <ToastStateContext.Provider value={state}>
        {children}
        <ToastViewport hostId={ROOT_HOST_ID} />
      </ToastStateContext.Provider>
    </ToastContext.Provider>
  )
}

function ToastViewport({ hostId }: { hostId: number }) {
  const { hideToast } = useToast()
  const { toastState, topHostId } = useToastState()

  if (hostId !== topHostId) return null

  return (
    <Toast
      message={toastState.message}
      type={toastState.type}
      visible={toastState.visible}
      onHide={hideToast}
      duration={toastState.duration}
    />
  )
}

// Mount inside a native modal (under a GestureHandlerRootView) to surface toasts
// above it with working swipe-to-dismiss. `active` should track the modal's
// visibility so a mounted-but-hidden modal never claims the toast.
export function ModalToastViewport({ active = true }: { active?: boolean }) {
  const { registerHost, unregisterHost } = useToast()
  const [hostId] = useState(() => nextHostId++)

  useEffect(() => {
    if (!active) return
    registerHost(hostId)
    return () => unregisterHost(hostId)
  }, [active, hostId, registerHost, unregisterHost])

  if (!active) return null

  return <ToastViewport hostId={hostId} />
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function useToastState() {
  const context = useContext(ToastStateContext)
  if (context === undefined) {
    throw new Error('useToastState must be used within a ToastProvider')
  }
  return context
}
