# Blades in the Dark Character Sheet

This is a character sheet web application for the tabletop RPG [Blades in the Dark](https://bladesinthedark.com/). It is front-end-only, so it can run on a static web host like [Cloudflare Pages](https://pages.cloudflare.com/) for free with no "server" required per se. That does mean there are no cloud saves, only local ones, but it's easy to export your character data to JSON and re-import it as needed. Cloud save/sync is a wishlist item I would like to implement at some point, but I don't currently have a plan for it. The app is powered by [Vue.js](https://vuejs.org/), a bit of otherwise plain JavaScript, and some straightforward HTML and CSS with no other dependencies.

This is intended as a user-friendly alternative to the fillable PDF character sheet without the quirks. It follows the same basic structure and formatting but with some tweaks to make things easier and more intuitive. For example, to fill an XP counter or clock, simply click on the last segment and all the preceding ones will automatically be filled too.

For an active hosted version, check out [doskvol.pages.dev](https://doskvol.pages.dev/)!