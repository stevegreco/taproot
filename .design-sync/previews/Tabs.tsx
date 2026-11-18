import * as React from "react";
import { TabPanel, Tabs } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/tabs.stories.js. Each TabPanel is one tab; `value` picks the selected one.
const Settings = ({ value = "profile" }: { value?: string }) => (
  <Tabs label="Account settings" value={value}>
    <TabPanel label="Profile" value="profile">
      <p>Your name, photo, and contact details.</p>
    </TabPanel>
    <TabPanel label="Notifications" value="notifications">
      <p>Choose which updates reach you by email.</p>
    </TabPanel>
    <TabPanel label="Billing" value="billing">
      <p>Your plan, payment method, and invoices.</p>
    </TabPanel>
  </Tabs>
);

export const Default = () => <Settings />;

export const SecondSelected = () => <Settings value="notifications" />;

export const Overflowing = () => (
  <div style={{ maxWidth: 320 }}>
    <Tabs label="Account settings">
      {["Overview", "Activity", "Members", "Permissions", "Integrations", "Settings"].map(
        (name) => (
          <TabPanel key={name} label={name}>
            <p>{name} content.</p>
          </TabPanel>
        ),
      )}
    </Tabs>
  </div>
);

export const RightToLeft = () => (
  <div dir="rtl">
    <Settings />
  </div>
);
