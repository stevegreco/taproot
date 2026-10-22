/**
 * Verify: run the steps in `avatar.verify.js`. The docs tests run them against the built site.
 */
import "@stevegreco/design-system-components";
import { defineAvatar } from "@stevegreco/design-system-components/avatar";

// The package root registers every component; Avatar is registered here until it joins the root.
defineAvatar();

// A stand-in portrait, so the example needs no network.
const PORTRAIT = `data:image/svg+xml,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="#8fb3a4"/><circle cx="32" cy="26" r="12" fill="#f1d4b8"/><path d="M10 64a22 22 0 0 1 44 0z" fill="#3f5f53"/></svg>',
)}`;

type Comment = { id: string; author?: string; picture?: string; text: string };

const COMMENTS: Comment[] = [
  { id: "ada", author: "Ada Lovelace", picture: PORTRAIT, text: "The draft reads well. Ship it." },
  {
    id: "grace",
    author: "Grace Hopper",
    // This picture is missing, so the initials show instead.
    picture: "/people/grace-hopper.png",
    text: "One typo in the second section, otherwise good.",
  },
  { id: "former", text: "Can we add a summary at the top?" },
];

export default function AvatarExample() {
  return (
    <div className="flex max-w-xl flex-col gap-4 p-6 text-slate-900 dark:text-white">
      <header className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-700">
        <h3 className="m-0 text-base font-semibold">Launch plan</h3>
        {/* Nothing else names the signed-in person here, so the avatar carries the name. */}
        <ds-avatar name="Ada Lovelace" image={PORTRAIT} data-avatar-account />
      </header>

      <ul className="m-0 flex list-none flex-col gap-3 p-0" aria-label="Comments">
        {COMMENTS.map((comment) => (
          <li key={comment.id} className="flex items-start gap-3" data-avatar-comment={comment.id}>
            {/* The author's name is printed beside it, so the avatar is decorative. */}
            <ds-avatar
              size="small"
              name={comment.author}
              image={comment.picture}
              decorative
              data-avatar-subject
            />
            <div>
              <p className="m-0 text-sm font-semibold">{comment.author ?? "Former member"}</p>
              <p className="m-0 text-sm">{comment.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
