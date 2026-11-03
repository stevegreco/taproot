/**
 * Verify: run the steps in `tabs.verify.js`. The docs tests run them against the built site.
 */
import "@stevegreco/web-components";

export default function TabsExample() {
  return (
    <div className="flex max-w-xl flex-col gap-2 p-6 text-slate-900 dark:text-white">
      <h3 className="text-lg font-semibold">Order 1042</h3>
      <ds-tabs label="Order 1042" value="details" data-tabs-order>
        <ds-tab-panel label="Details" value="details" data-tabs-panel="details">
          <p>3 items, placed June 2. Paid with the card ending 4242.</p>
        </ds-tab-panel>
        <ds-tab-panel label="Shipments" value="shipments" data-tabs-panel="shipments">
          <p>
            Shipped June 3 in one package.{" "}
            <ds-link href="#tabs-tracking" data-tabs-tracking>
              Track package
            </ds-link>
          </p>
        </ds-tab-panel>
        <ds-tab-panel label="History" value="history" data-tabs-panel="history">
          <p>Placed June 2, paid June 2, shipped June 3.</p>
        </ds-tab-panel>
      </ds-tabs>
    </div>
  );
}
