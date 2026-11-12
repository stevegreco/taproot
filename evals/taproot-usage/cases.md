# Taproot usage eval: draft tasks

Generated from `cases.json` by `check-cases.mjs`. 36 tasks. Each runs through the CLI, the MCP server, and the control with neither.

Drafted from the spec, not from real requests, so they may be cleaner than what people actually ask.

## choose (16)

| Id | Request | Expected |
| --- | --- | --- |
| `choose-instant-setting` | On our settings page people should be able to turn email notifications on. It should take effect right away, with no save button. Which Taproot component should I use? | component.switch |
| `choose-consent-in-form` | Our signup form has a 'send me product news' option that gets saved with everything else when they press Create account. Which Taproot component fits that option? | component.checkbox |
| `choose-few-visible-options` | Checkout offers three shipping speeds and I want people to compare them all at a glance before picking one. Which Taproot component? | component.radio-group |
| `choose-long-list` | I need a country field on an address form, about 200 countries, and people can only pick one. Which Taproot component? | component.select |
| `choose-views-same-subject` | A project page has Overview, Activity, and Members. Only one shows at a time and the address shouldn't change. Which Taproot component? | component.tabs |
| `choose-open-several` | Our FAQ page is really long. People should be able to open whichever questions they care about, even several at once. Which Taproot component? | component.accordion |
| `choose-save-failed-message` | When saving a form fails I want to show 'We couldn't save your changes' above the form with a Try again action. It shouldn't stop them from using the page. Which Taproot component? | component.alert |
| `choose-table-status` | Each row in our invoices table needs to show Paid or Overdue. Which Taproot component? | component.badge |
| `choose-block-until-confirmed` | Before someone deletes their account they have to confirm, and they shouldn't be able to do anything else until they answer. Which Taproot component? | component.dialog |
| `choose-known-progress` | We're importing a CSV and we know how many of the rows are done so far. How should I show that with Taproot? | component.progress-bar |
| `choose-unknown-wait` | Search results come back from the server and we have no idea how long that takes. What Taproot component shows we're working on it? | component.spinner |
| `choose-rough-level` | I'm adding a volume control to a video player. People adjust by ear. Which Taproot component? | component.slider |
| `choose-exact-large-number` | People need to order an exact quantity, anywhere from 1 to 10,000. A designer suggested a slider. What does Taproot say to use? | component.text-field |
| `choose-format-help` | I want a little tooltip explaining the required password format on our password field. Is that right in Taproot, or which component should carry that help? | component.text-field |
| `choose-clickable-status-chip` | We have Badges showing Open and Closed, and I want to make them clickable so pressing one filters the list in the current view. What should the clickable thing be in Taproot? | component.button |
| `choose-nav-styled-action` | At the bottom of a dashboard card I want 'View all projects', which takes people to the projects page. Which Taproot component is the control? | component.link |

## no-match (3)

| Id | Request | Expected |
| --- | --- | --- |
| `nomatch-date-picker` | I need a date picker with a calendar popup for a booking form. Which Taproot component is that? | (no component: says none fits) |
| `nomatch-data-table` | I need a data table with sortable columns and pagination. Which Taproot component is that? | (no component: says none fits) |
| `nomatch-file-dropzone` | I want a drag-and-drop area for uploading files. Which Taproot component does that? | (no component: says none fits) |

## compose (2)

| Id | Request | Expected |
| --- | --- | --- |
| `compose-avatar-presence` | I want to show a person's picture and whether they're online. Which Taproot components do I use? | component.avatar + component.badge |
| `compose-account-menu-trigger` | Pressing a person's picture in the header should open their account menu. Which Taproot components make up that pressable picture? | component.avatar + component.button |

## fact (15)

| Id | Request | Expected |
| --- | --- | --- |
| `fact-button-submit` | Using the web components, how do I make a Taproot button submit its form? Give me the exact attribute and value. | attribute: type; value: submit |
| `fact-button-accessible-name` | My Taproot web component button only contains an icon. Which attribute gives it a name for screen readers? | attribute: aria-label |
| `fact-button-full-width` | Which attribute makes a Taproot web component button fill its container's width? | attribute: full-width |
| `fact-progress-tag` | For the Taproot progress bar web component, what's the tag name, and which function do I import to register it? | tag: ds-progress-bar; define_export: defineProgressBar |
| `fact-alert-dismiss-label` | We translate our UI. Which attribute on the Taproot alert web component sets the text for its dismiss control? | attribute: dismiss-label |
| `fact-dialog-keep-open` | On the Taproot dialog web component, someone presses Escape with unsaved work. Which event do I listen for and call preventDefault on to keep it open? | event: cancel |
| `fact-dialog-action-slot` | Which slot do I put the Cancel and Delete buttons in on the Taproot dialog web component? | slot: actions |
| `fact-primary-hover-values` | What token sets the background of a Taproot primary button on hover, and what's its hex value in the light and dark themes? | token: semantic.color.background.action.primary.hover; light: #823f1e; dark: #e8c468 |
| `fact-focus-ring-tokens` | Which Taproot tokens set the focus ring's width and offset across the system? | width_token: semantic.focus.width; offset_token: semantic.focus.offset |
| `fact-tooltip-link-rule` | A teammate wants to put a link inside a Taproot tooltip bubble. Which rule does that break? Give its address and level. | rule: component.tooltip#not-interactive; level: MUST |
| `fact-dialog-backdrop-rule` | A designer wants clicking outside a Taproot dialog to close it. Which rule covers that? Give its address and level. | rule: component.dialog#cancellation; level: MUST |
| `fact-react-slider` | In our React app, what do I import for a Taproot slider, and from which package? | export: Slider; package: @taproot-ds/react-components |
| `avail-web-slider` | Is there a Taproot slider web component I can use today? If so, what's its tag name? | available: false; tag: null |
| `avail-react-tooltip` | Is there a Taproot tooltip for React I can use today? If so, what's its export name? | available: false; export: null |
| `avail-web-tooltip` | Is there a Taproot tooltip web component I can use today? If so, what's its tag name? | available: true; tag: ds-tooltip |
