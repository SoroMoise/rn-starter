import { MMKV } from 'react-native-mmkv'

const ENCRYPTION_KEY = 'entl-v1-7d41c9a2'

export const secureMmkv = new MMKV({ id: 'entitlements', encryptionKey: ENCRYPTION_KEY })
