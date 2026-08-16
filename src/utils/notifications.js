// ── Push Notifications (Firebase Cloud Messaging) ──
// Handles asking the browser for permission, registering this device with
// FCM, and showing a lightweight in-app banner for messages that arrive
// while the app is open (the OS notification tray is only used when the
// app is in the background/closed).

import { getToken, onMessage } from 'firebase/messaging'
import { doc, setDoc, arrayUnion } from 'firebase/firestore'
import { messagingPromise, db } from '../firebase/config'

// Web Push certificate (VAPID key), generated in:
// Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
const VAPID_KEY = 'BIltAx5T1pUJ5gGr-OGYbpMRNCYXQz1XBuXgSMwTS2ANXoBtMQGCa_RX2jeR_HKeYigoFQemW3goDbYmHVwFi68'

/** Current browser permission state: 'default' | 'granted' | 'denied' | 'unsupported'. */
export function getNotificationPermission() {
  return typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
}

export async function isPushSupported() {
  if (typeof Notification === 'undefined') return false
  const messaging = await messagingPromise
  return !!messaging
}

/**
 * Prompts for notification permission and, if granted, registers this
 * device with Firebase Cloud Messaging. Returns the FCM token on success,
 * or null if permission was denied / push isn't supported here.
 * Pass the signed-in user's uid to also save the token to their Firestore
 * profile (fcmTokens array) — useful later if you ever want to target
 * specific users instead of broadcasting to everyone.
 */
export async function enablePushNotifications(uid) {
  if (typeof Notification === 'undefined') return null
  const messaging = await messagingPromise
  if (!messaging) return null

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return null

  const token = await getToken(messaging, { vapidKey: VAPID_KEY })
  if (token && uid) {
    try {
      await setDoc(doc(db, 'users', uid), { fcmTokens: arrayUnion(token) }, { merge: true })
    } catch (e) {
      console.error('Failed to save FCM token', e)
    }
  }
  return token
}

/**
 * Registers a callback for messages that arrive while the app is open
 * (foreground). Foreground messages don't show a system notification
 * automatically, so the caller is responsible for displaying something
 * (e.g. a small banner) with the payload it receives.
 */
export function listenForForegroundMessages(onNotification) {
  messagingPromise.then(messaging => {
    if (!messaging) return
    onMessage(messaging, payload => onNotification?.(payload))
  })
}
