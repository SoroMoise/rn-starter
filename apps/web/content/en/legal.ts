import { SITE, STORE_URL } from '@/lib/site'
import type { LegalContent } from '../types'

// A starting point, not legal advice. It describes what the starter itself does — Google AdMob with
// Google's consent form, Firebase Analytics and Crashlytics without a user id, RevenueCat on an
// anonymous id, notifications scheduled on the device — and every app built on it adds, removes
// and has the result reviewed. Bracketed passages are choices the publisher makes.
export const enLegal: LegalContent = {
  privacy: {
    title: 'Privacy policy',
    description: `What ${SITE.name} collects, what stays on your device, which providers receive data, and how to exercise your rights.`,
    intro: [
      `${SITE.name} is a mobile app published by ${SITE.publisher}. This policy explains what the app and this website collect, why, who else receives it, and what you can decide for yourself.`,
      'The app needs no account. Most of what it stores never leaves your device; what does is advertising and measurement data, crash reports and, if you buy the Pro upgrade, the record of that purchase. Each is described below.',
    ],
    sections: [
      {
        title: 'The short version',
        paragraphs: ['If you read nothing else on this page, these are the points that matter.'],
        list: [
          'There is no account and no sign-up. Your settings stay on your phone, and uninstalling the app deletes them.',
          'The free version shows ads through Google AdMob, which reads your device’s advertising identifier. Where the law requires it, you are asked first, and Pro removes ads entirely.',
          'Google Firebase tells us which features are used and when the app crashes, without knowing who you are.',
          'A purchase is processed by your app store; we never see your payment details.',
          'We do not sell your data, and you can ask us to show, correct or delete what we hold.',
        ],
      },
      {
        title: 'Who is responsible for your data',
        paragraphs: [
          `The controller of the personal data described here is ${SITE.publisher}, publisher of the app and of this website. To ask a question or exercise a right, write to ${SITE.supportEmail} and say which device and which version of the app you use, so we can find the right records.`,
        ],
      },
      {
        title: 'What the app collects automatically',
        paragraphs: [
          'The following is collected when you use the app, without you entering anything, through software development kits from Google and RevenueCat embedded in it. It is described in the same terms Google uses, so you can match it against the data safety section of the app’s Google Play listing.',
        ],
        list: [
          'Device or other identifiers: the advertising identifier of your device, read by Google AdMob; a Firebase installation identifier that groups events and crash reports by installation; and an anonymous identifier generated on your device for RevenueCat. None of them is your name or your e-mail address, and the advertising identifier can be reset.',
          'App activity: the screens you open, the features you use, the offers shown to you and the plan you buy with its price — never a payment identifier — collected by Firebase Analytics.',
          'App information and performance: crash logs and diagnostics — the state of the app and of the device when something failed — collected by Firebase Crashlytics, with your app language and theme.',
          'Technical information: device model, operating system and app version, system language, and an approximate location inferred from your IP address, which AdMob uses to select ads.',
          'Purchase history: if you buy Pro, the product bought and the receipt issued by the store, received by RevenueCat.',
        ],
      },
      {
        title: 'What stays on your device',
        paragraphs: [
          'The app keeps the following in its private storage on your phone. We cannot read it, and it is deleted when you clear the app’s data or uninstall it.',
          'Android may include your preferences in the device backup kept in your Google account, so a new phone picks them up. The copy of your Pro status is excluded from that backup: on a new device, the store confirms it again.',
        ],
        list: [
          'Your preferences: language and theme, and whether you completed the introduction.',
          'Counters the app uses to pace itself: how many times you opened it, how many actions you completed, when it was installed, and when an offer or a rating prompt was last shown.',
          'An encrypted copy of your Pro status and its expiry date, so Pro keeps working offline.',
          'The end of an ad-free period earned by watching a rewarded video.',
        ],
      },
      {
        title: 'Advertising through Google AdMob',
        paragraphs: [
          'The free version of the app shows ads supplied by Google AdMob; that is how it stays free. This website shows none.',
          'Where the law requires consent before personalised advertising — in the European Economic Area, the United Kingdom and Switzerland — the app presents Google’s consent form, and no ad is requested before you have answered it. Where your region requires the choice to stay open, it can be changed later from the app’s settings.',
          'To select and measure ads, the AdMob SDK reads your advertising identifier and the technical information listed above. Google acts as an independent controller for the ads it serves, under its own privacy policy (policies.google.com/privacy). We do not receive the profile Google builds, and we do not sell or share your data with advertisers ourselves.',
        ],
        list: [
          'Reset or delete your advertising identifier in your device settings (Settings, then Google, then Ads, on most Android phones). Ads keep appearing, but are no longer personalised.',
          'Watch an optional rewarded video to suspend ads for a limited time.',
          'Upgrade to Pro, which removes every ad from the app for as long as it is active.',
        ],
      },
      {
        title: 'Analytics and crash reports',
        paragraphs: [
          'Firebase Analytics tells us, in aggregate, which features are used and where people stop, so development goes where it matters. Firebase Crashlytics reports crashes so we can fix them. Neither is given your name, your e-mail address or an account identifier: the app never sets one.',
        ],
      },
      {
        title: 'The Pro upgrade and payments',
        paragraphs: [
          'Pro is sold through your app store, which collects the payment and holds your payment method. We never see your card number, bank details or billing address.',
          'RevenueCat records that a purchase happened and tells the app whether Pro is active. It receives the anonymous identifier generated on your device, the store receipt, the product bought and basic device information, and processes them on our behalf under its own privacy policy (revenuecat.com/privacy).',
        ],
      },
      {
        title: 'Notifications',
        paragraphs: [
          'If the app offers reminders and you allow notifications, they are scheduled on your device by the app itself: nothing is sent to a server to deliver them. The app asks for the permission from the screen where you turn a reminder on, never at launch, and you can withdraw it at any time in your device’s settings.',
        ],
      },
      {
        title: 'This website',
        paragraphs: [
          'This website sets no cookies, runs no analytics, loads no third-party scripts and shows no ads. As with any website, the hosting provider keeps short-lived technical logs, which may include your IP address, for security and troubleshooting.',
        ],
      },
      {
        title: 'Why we process this data, and on what legal basis',
        paragraphs: [
          'For users in the European Economic Area, the United Kingdom and Switzerland, the law requires a legal basis for each purpose. Ours are the following.',
        ],
        list: [
          'Performance of a contract: providing the app’s features and unlocking the Pro features you paid for.',
          'Consent: personalised advertising where the law requires consent, and notifications, which the system only allows once you grant the permission. You can withdraw either at any time, without affecting what happened before.',
          'Legitimate interest: aggregate analytics and crash reports, to improve and fix the app, kept free of direct identifiers.',
          'Legal obligation: keeping the records accounting and tax rules require in connection with a purchase.',
        ],
      },
      {
        title: 'Who else receives data',
        paragraphs: [
          'We do not sell your personal data. The providers below receive data because a feature cannot work without them, each under its own published terms.',
        ],
        list: [
          'Google (AdMob): selecting and measuring ads in the free version.',
          'Google (Firebase Analytics and Crashlytics): usage measurement and crash reports.',
          'Your app store (Google Play or the App Store): payment, refunds and subscription management.',
          'RevenueCat: validating purchases and managing the Pro entitlement on our behalf.',
          'Public authorities: only when a valid legal request obliges us to, and only to the extent required.',
        ],
      },
      {
        title: 'Where your data is processed',
        paragraphs: [
          'Google and RevenueCat operate in several countries, including the United States, so some of this data is processed outside the European Economic Area. Those transfers rely on the safeguards these providers document, such as the European Commission’s standard contractual clauses or the EU–US Data Privacy Framework where the provider is certified under it.',
        ],
      },
      {
        title: 'How long data is kept',
        paragraphs: ['We keep data only as long as the purpose that justified it lasts.'],
        list: [
          'Analytics events: for the retention period set in the app’s Google Analytics settings, [2 or 14 months].',
          'Crash reports: 90 days.',
          'Purchase records: while the subscription or purchase is active, then as long as accounting and tax rules require.',
          'Data on your device: until you clear the app’s data or uninstall it.',
          'Messages you send us: as long as needed to answer them, [and at most N months after the last exchange].',
        ],
      },
      {
        title: 'Children',
        paragraphs: [
          'The app is not directed at children, and we do not knowingly collect personal data from anyone below the age at which consent is valid in their country. If you believe a child has given us personal data, write to us and we will delete what we hold.',
        ],
      },
      {
        title: 'Your rights',
        paragraphs: [
          `You can ask us for access to your personal data, its correction or deletion, a copy in a portable format, or a restriction of its use; you can object to processing based on our legitimate interest, and withdraw a consent at any time. Write to ${SITE.supportEmail}: we answer within one month. The app holds no account, so we may ask for details that identify your installation.`,
          'Deleting what the app holds on your phone is immediate and in your hands: clear its data or uninstall it. For the data processed by Google and RevenueCat, you can also use the tools those providers offer, and your device’s advertising and privacy settings.',
          'You also have the right to lodge a complaint with a data protection authority — [the authority of the country where the publisher is established], or the one where you live.',
        ],
      },
      {
        title: 'Changes to this policy',
        paragraphs: [
          'When this policy changes, the date at the top of the page changes with it. A change that materially affects how your data is handled is announced in the app before it takes effect, and where the law requires new consent, we ask for it.',
        ],
      },
    ],
  },

  terms: {
    title: 'Terms of service',
    description: `The terms of use of ${SITE.name}: the licence, the free version and its ads, how Pro is billed, cancelled and restored.`,
    intro: [
      `These terms govern your use of the ${SITE.name} mobile app and of this website, both published by ${SITE.publisher}. By installing or using the app, you accept them; if you do not, do not use it.`,
      'The app is free to download and use. Some features are part of a paid upgrade, Pro, described below.',
    ],
    sections: [
      {
        title: 'Who these terms are between',
        paragraphs: [
          `These terms are an agreement between you and ${SITE.publisher} (“we”). The app is distributed through app stores; the store is not a party to this agreement, but its own terms also apply to your download and to any purchase you make there.`,
        ],
      },
      {
        title: 'What the service is',
        paragraphs: ['[Describe what the app does, in a few sentences, and what it does not do.]'],
      },
      {
        title: 'Your licence to use the app',
        paragraphs: [
          'We grant you a personal, non-exclusive, non-transferable and revocable licence to use the app on devices you own or control, for your own purposes. It gives you a right of use, not ownership of the app, its code, its design or its content.',
        ],
      },
      {
        title: 'What you may not do',
        paragraphs: ['You agree not to do any of the following, yourself or through someone else.'],
        list: [
          'Copy, modify, distribute, rent, sell or sublicense the app, or redistribute it outside the stores that carry it.',
          'Reverse-engineer, decompile or disassemble it, except where the law expressly allows it despite this restriction.',
          'Circumvent or interfere with the ads in the free version, or with the checks that decide whether Pro is unlocked.',
          'Disrupt the app or the services it relies on, or use it for any unlawful purpose.',
        ],
      },
      {
        title: 'The free version and its ads',
        paragraphs: [
          'The free version is funded by ads served through Google AdMob. We do not write or select them and are not responsible for their content; a complaint about a specific ad goes to Google. You can suspend ads for a limited time by watching an optional rewarded video, or remove them with Pro.',
          '[List what the free version includes, and any allowance it is limited to.]',
        ],
      },
      {
        title: 'Pro: plans, prices and billing',
        paragraphs: [
          'Pro unlocks the features reserved for it, starting with the removal of every ad. [List the other Pro features.]',
          'The plans on offer, their prices, billing periods and any free trial are those shown in the app at the moment you buy, in your currency, and confirmed by your store before you pay. The store charges the payment method on your account.',
          'A subscription renews automatically at the end of each period, at the price then in force, unless you cancel before that period ends — on the App Store, at least 24 hours before. If a price changes, your store tells you beforehand and, where required, asks for your agreement. A one-time purchase unlocks Pro with no recurring charge, for as long as the app remains available.',
        ],
      },
      {
        title: 'Free trials',
        paragraphs: [
          'Where a plan includes a free trial, the app states its length before you start it. Unless you cancel before it ends, the trial turns into a paid subscription and your store charges you. A trial is offered once per store account, where the store makes it available.',
        ],
      },
      {
        title: 'Cancelling, refunds and withdrawal',
        paragraphs: [
          'You cancel a subscription in your store account; the app links to the right page from its settings. Cancelling stops the next renewal, and Pro stays active until the end of the period already paid. Uninstalling the app does not cancel a subscription.',
          'Refunds are handled by your store under its own policy. Write to us if something went wrong with a purchase, and we will help where we can.',
          'If you are a consumer in the European Union or the United Kingdom, the law may give you a right of withdrawal for digital content, which can end once supply begins with your consent. Nothing in these terms removes the mandatory consumer rights of your country of residence.',
        ],
      },
      {
        title: 'Restoring a purchase, and failed renewals',
        paragraphs: [
          'Pro is attached to the store account that bought it. Installing the app on another device signed in to that account restores it, and the app offers a restore action if it does not appear on its own.',
          'If a renewal payment fails, your store decides whether the subscription keeps giving access for a while so you can fix the payment method. The app follows what the store reports and grants no access of its own beyond it; while that window is open, it tells you when access ends.',
        ],
      },
      {
        title: 'Availability and changes',
        paragraphs: [
          'We may change, suspend or discontinue the app or any of its features, and we do not guarantee that it will always be available or free of errors. We may also change these terms: the date at the top of the page changes with them, a material change is announced in the app before it takes effect, and continuing to use the app afterwards means you accept it.',
        ],
      },
      {
        title: 'Intellectual property',
        paragraphs: [
          `The app, its name, its code, its design and its content belong to ${SITE.publisher} or its licensors. Open-source components remain under their own licences, and third-party trademarks belong to their owners.`,
        ],
      },
      {
        title: 'Third-party services',
        paragraphs: [
          'The app relies on third parties — among them Google for distribution, advertising, analytics and crash reports, your app store for payments, and RevenueCat for purchases. We are not responsible for their availability or their failures, and their own terms apply to your use of them.',
        ],
      },
      {
        title: 'Limitation of liability',
        paragraphs: [
          'The app is provided as is and as available. To the fullest extent the law allows, we exclude implied warranties and are not liable for indirect or consequential loss, loss of data or loss of profit; where liability cannot be excluded, ours is limited to the amount you paid for Pro in the twelve months before the claim. Nothing here limits liability that the law does not allow to be limited, including under the mandatory consumer rules of your country.',
        ],
      },
      {
        title: 'Ending your use of the app',
        paragraphs: [
          'You can stop using the app at any time by uninstalling it; an active subscription is cancelled separately, in your store account. We may suspend or end your access if you breach these terms.',
        ],
      },
      {
        title: 'Privacy',
        paragraphs: [
          'How the app handles your personal data is set out in our privacy policy, which forms part of these terms.',
        ],
      },
      {
        title: 'Technical requirements',
        paragraphs: [
          `The app runs on Android 8.0 or later and is available on Google Play (${STORE_URL}). You are responsible for the data charges your use generates.`,
        ],
      },
      {
        title: 'Governing law',
        paragraphs: [
          'These terms are governed by [the law of the publisher’s country], without prejudice to the mandatory consumer-protection rules of the country where you habitually reside, whose courts you may also seize.',
        ],
      },
      {
        title: 'Severability and language',
        paragraphs: [
          'If a provision of these terms is held invalid, the others remain in force. These terms are published in English and in French; if the two differ, the [English or French] version prevails.',
        ],
      },
      {
        title: 'Contact',
        paragraphs: [
          `For any question about these terms, a purchase or the app, write to ${SITE.supportEmail}, saying which device and which version of the app you use.`,
        ],
      },
    ],
  },
}
