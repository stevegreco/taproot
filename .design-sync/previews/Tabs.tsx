import * as React from "react";
import { Tabs, TabsSection } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/tabs.stories.js with Tabs from @taproot-ds/react-components.
// Each TabsSection is one tab and needs a unique `value`; `value` on Tabs picks the selected one.
const Settings = ({ value = "profile" }: { value?: string }) => (
  <Tabs accessibleName="Account settings" value={value}>
    <TabsSection label="Profile" value="profile">
      <p>Your name, photo, and contact details.</p>
    </TabsSection>
    <TabsSection label="Notifications" value="notifications">
      <p>Choose which updates reach you by email.</p>
    </TabsSection>
    <TabsSection label="Billing" value="billing">
      <p>Your plan, payment method, and invoices.</p>
    </TabsSection>
  </Tabs>
);

export const Default = () => <Settings />;

export const SecondSelected = () => <Settings value="notifications" />;

export const Overflowing = () => (
  <div style={{ maxWidth: 320 }}>
    <Tabs accessibleName="Account settings">
      {["Overview", "Activity", "Members", "Permissions", "Integrations", "Settings"].map(
        (name) => (
          <TabsSection key={name} label={name} value={name.toLowerCase()}>
            <p>{name} content.</p>
          </TabsSection>
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
