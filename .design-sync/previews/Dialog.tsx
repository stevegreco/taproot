import * as React from "react";
import { Button, Dialog } from "@taproot-ds/react-wrappers";

// Mirrors apps/storybook/stories/dialog.stories.js: a button opens the dialog, and
// the actions close it. Controlled with `open` and `onClose`.
function DeleteProject({
  initiallyOpen = false,
  description = "Deleting removes its files permanently.",
  dismissible = true,
}) {
  const [open, setOpen] = React.useState(initiallyOpen);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open dialog</Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        label="Delete archived project?"
        description={description}
        dismissible={dismissible}
      >
        <p>Other projects remain available.</p>
        <Button slot="actions" variant="secondary" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button slot="actions" variant="destructive" onClick={() => setOpen(false)}>
          Delete project
        </Button>
      </Dialog>
    </>
  );
}

export const Default = () => <DeleteProject />;

export const Open = () => <DeleteProject initiallyOpen />;

export const WithoutDescription = () => <DeleteProject initiallyOpen description="" />;

export const ExplicitCloseOnly = () => <DeleteProject initiallyOpen dismissible={false} />;
