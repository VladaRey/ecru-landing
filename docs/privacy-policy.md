# Privacy Policy for Ecru

**Effective date:** 4 October 2026

## The short version

Ecru holds nothing that identifies you. There are no accounts and no servers
keeping your things: your wardrobe, your photos and your answers live on your
device.

Three things do leave the phone, and all three are named below: the update
check, anonymous usage statistics (which you can switch off), and — only if you
turn it on or plan a trip — a rounded location used to look up the weather.
None of them carries anything from your wardrobe.

The Ecru website keeps nothing at all: no analytics, no cookies, no forms.
**This website** below says so in full.

## What Ecru stores on your device

Ecru keeps the following in a private database on your device:

- your answers to the colour-type questions (hair, eyes, skin tone, jewellery
  preference, veins, reaction to sun) and the colour type calculated from them.
  If you pick those colours from a photo of yourself, the photo is used only
  while you pick; it is not saved to your wardrobe or your profile;
- photos of your clothes and the information you add about them — category,
  colours, season, formality, price, and any notes. If you remove a
  background, the cut-out sits next to the original photo, which is kept;
- outfits you assemble, the days you wore them, and the days you plan them
  for, with the occasion you name;
- your wishlist: photos and notes about things you are thinking of buying,
  and the app's verdict on them;
- your trips: the destination, the dates, the forecast for each day and the
  packing list with its ticks.

This database lives in Ecru's own storage area on your device. It is not
uploaded, synchronised, or shared with us or anyone else, because Ecru has no
server to upload it to.

## Camera, photo library and location

Ecru asks for permissions, and only uses them for what you ask it to do:

**Camera** — to photograph an item of clothing when you add it, and, if you
choose, to take a selfie to find your colour type. Photos are processed
entirely on your device. Clothing photos are kept in the app's storage; the
selfie is not.

**Photo library** — to let you pick existing photos of your clothes or of
yourself, and to save item photos or outfit pictures to your library when you
choose to.

Ecru does not read location data attached to your photos. It does not browse,
index, or upload your photo library; it receives only the images you
specifically select.

**Location (while using the app).** Only if you turn weather on, and only to
look up today's forecast. You can name a city instead and never grant it. See
**Weather** below for what is sent.

**Notifications.** Only if you turn them on, in Profile → Settings →
Notifications, or say yes when the app offers them once after your first
planned outfit or trip. They are local: the phone schedules them itself, with
no server and no push token, so nothing but your device knows what to remind
you of and when. They are silent and arrive at most once a morning — a planned
outfit, a trip you have not started packing, or a sharp change in the weather.

You can refuse or revoke any of these in your device settings. Ecru will keep
working, minus the features that need them.

## Usage statistics

Ecru counts how the app is used, through PostHog. The events are anonymous:
when the app is opened and which screens are opened; when an item is added or
removed, with its category only; whether the colour the app suggested had to be
corrected by hand; whether the colour-type questions were finished; whether a
suggested outfit was opened, saved, worn, planned ahead or shared (for a plan,
only how many days ahead and whether an occasion was named, never the name);
whether a background was removed; how trips, the weather suggestions and the
wishlist are used — for example, how many days a trip lasts or how many outfits
were found; whether a backup was saved or restored, with the number of items
only; and whether notifications were turned on or off. The events themselves are numbers and short labels.

Alongside each event, PostHog receives the standard technical details its
library adds: a random identifier created when the app is installed and a
session identifier, the device model, the iOS and app versions, the screen
size, the language and region setting, and the time zone. Your connection's IP
address reaches PostHog as with any request over the internet; the project is
set to discard it rather than store it.

**What is never sent:** your photos or their file paths, your notes, brands or
item names, the colours of your clothes, your name, your location and where you
travel. PostHog is also told not to work out a country or city from your
connection. No profile is created for you, and screen recording is switched
off.

Counting does not begin until you have been through the introduction and added
your first item — with one exception. On the very first launch the app sends a
single empty event that says only that it has been opened for the first time,
so we can tell how many people leave before adding anything. It carries no
properties and is sent once per install. You can switch counting off at any
time in **Profile → Settings → Data and privacy → Anonymous usage
statistics**, and that choice survives a
profile reset.

PostHog stores the events in the European Union and acts as a processor on our
behalf. Its own policy is at posthog.com/privacy.

## Weather

The Today tab can show the weather and pick outfits for it. This is
off until you turn it on, and the app works fully without it.

To look up the forecast it needs a place — either this device's location, or a
city you type in; the name you type is sent to Open-Meteo's place search to
find it. **Coordinates are rounded to about 11 kilometres before they are
sent**, so a request says roughly which town you are in and nothing closer.

Trips use the same service: to plan one, the app sends the destination's
rounded coordinates and the trip dates. If notifications about sharp weather
changes are on, the app asks the same service for today's and tomorrow's
forecast for the same rounded place when you open it.

All of this goes to Open-Meteo (open-meteo.com) and nowhere else, carries
nothing from your wardrobe, and is not stored by us. Turning weather off erases
the saved place; resetting your profile erases it together with your trips.

## What Ecru does not do

- It does not create an account or ask for an email address.
- It does not send anything from your wardrobe over the internet: no photos, no
  items, no colour profile.
- It does not use crash reporting or advertising, and contains no third-party
  tracking SDK.
- It does not share, sell, or disclose your information to third parties.
- It does not track you across apps or websites, and never asks for permission
  to.

## Sharing

If you choose to share an outfit, Ecru hands the picture to your device's
standard share sheet; Ecru itself uploads nothing. What happens next is governed by the privacy
policy of whichever app or service you send it to.

## Wardrobe backups

In Settings you can save a backup of your wardrobe as one file (.zip): item
photos, items, outfits and plans, the wear log, trips, the wishlist and your
colour type. The file is put together on the device and handed to the
standard share sheet — to wherever you send it yourself (Files, AirDrop,
email, a cloud drive). We never receive or see it. It is not encrypted, so
keep it as you would keep the photos themselves. Restoring from a backup
replaces everything currently in the app.

## Device backups

If you have device backups enabled (for example iCloud Backup), your device's
operating system may include Ecru's data in those backups. This is handled by
Apple, not by Ecru, and is covered by Apple's privacy policy.

## Deleting your data

You can delete individual items, outfits and trips inside the app at any time,
or reset your profile (at the bottom of the Profile tab) to erase all of them
at once. Backup files you saved are wherever you put them; delete them there.

Deleting the app removes its database and every photo stored inside it from
your device. Nothing from your wardrobe was ever sent anywhere, so that is the
whole of it — there is no copy for us to delete, and no request you need to
send us. The anonymous usage events carry only a random identifier we cannot
connect to you, so we cannot find yours to hand over or delete on request;
switching statistics off in Settings stops them.

Photos you explicitly saved to your photo library stay there; delete them the
way you would delete any other photo.

## Children

Ecru is not directed at children and collects nothing that identifies anyone.
This holds for users of every age.

## This website

Everything above describes the Ecru app. This section describes the site you
are reading it on.

**No analytics.** The site counts nothing. There is no analytics service, no
page counter and no tracking of any kind: opening a page here leaves no record
with us or with anyone acting on our behalf.

**No cookies.** The site sets no cookies and stores nothing in your browser.
That is why the footer says what it says, and why you are not being asked to
consent to anything. The practical effect is that the site cannot recognise
you when you come back, and does not try to.

**No forms.** There is nothing on the site to type an email address into. The
only thing either page asks you to do is open the App Store, and that is a
link like any other — Apple sees it, we do not.

**Nothing to remove.** Since we hold no record of your visit, there is nothing
to delete on request. If you have written to us, the mail is in our mailbox
and asking will get it deleted.

## Changes to this policy

If a future version of Ecru changes how it handles data, this policy will be
updated and the effective date above will change. Material changes will be
described in the app's release notes.

## Contact

Questions about this policy: [CONTACT EMAIL]
