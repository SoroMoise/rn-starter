import { MMKV } from 'react-native-mmkv'

// Obfuscation, not secrecy: the key ships in the bundle. It closes the cheap attack — pull the
// file, flip the flag, put it back. MMKV reads its first 16 bytes and ignores the rest, and it
// must never change once released: what it wrote becomes unreadable.
const ENCRYPTION_KEY = 'entl-v1-7d41c9a2'

// Entitlement keys only. Never encrypt `mmkv` itself: whatever an install already wrote there
// would become unreadable. plugins/withBackupRules.js names this instance's files.
export const secureMmkv = new MMKV({ id: 'entitlements', encryptionKey: ENCRYPTION_KEY })
