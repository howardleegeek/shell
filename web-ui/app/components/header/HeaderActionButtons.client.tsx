import { useState } from "react";
import { useStore } from "@nanostores/react";
import { workbenchStore } from "~/lib/stores/workbench";
import { DeployButton } from "~/components/deploy/DeployButton";
import { LocalChainButton } from "~/components/workbench/LocalChainButton";
import { TestButton } from "~/components/workbench/TestButton";
import { BuildButton } from "~/components/workbench/BuildButton";
import { buildRunStore } from "~/lib/stores/build-runner";

interface HeaderActionButtonsProps {
  chatStarted: boolean;
}

export function HeaderActionButtons({
  chatStarted: _chatStarted,
}: HeaderActionButtonsProps) {
  const [activePreviewIndex] = useState(0);
  const previews = useStore(workbenchStore.previews);
  const buildRun = useStore(buildRunStore);
  const activePreview = previews[activePreviewIndex];

  const shouldShowButtons = activePreview;
  const buildStatusLabel =
    buildRun.status === "building"
      ? "Building..."
      : buildRun.status === "success"
        ? "Build ✓"
        : buildRun.status === "failed"
          ? "Build ✗"
          : "Build idle";

  return (
    <div className="flex items-center gap-1">
      {/* Local Chain Button */}
      <LocalChainButton />

      {/* Test Button */}
      <TestButton />

      {/* Build Button */}
      <BuildButton />

      <div
        className="rounded-md border border-bolt-elements-borderColor px-2.5 py-1 text-xs text-bolt-elements-textSecondary"
        title={buildRun.error ?? "Build status"}
      >
        {buildStatusLabel}
      </div>

      {/* Deploy Button */}
      {shouldShowButtons && <DeployButton />}

      {/* Debug Tools */}
      {shouldShowButtons && (
        <div className="flex border border-bolt-elements-borderColor rounded-md overflow-hidden text-sm">
          <button
            onClick={() =>
              window.open(
                "https://github.com/stackblitz-labs/bolt.diy/issues/new?template=bug_report.yml",
                "_blank",
              )
            }
            className="rounded-l-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs bg-accent-500 text-white hover:text-bolt-elements-item-contentAccent [&:not(:disabled,.disabled)]:hover:bg-bolt-elements-button-primary-backgroundHover outline-accent-500 flex gap-1.5"
            title="Report Bug"
          >
            <div className="i-ph:bug" />
            <span>Report Bug</span>
          </button>
          <div className="w-px bg-bolt-elements-borderColor" />
          <button
            onClick={async () => {
              try {
                const { downloadDebugLog } = await import(
                  "~/utils/debugLogger"
                );
                await downloadDebugLog();
              } catch (error) {
                console.error("Failed to download debug log:", error);
              }
            }}
            className="rounded-r-md items-center justify-center [&:is(:disabled,.disabled)]:cursor-not-allowed [&:is(:disabled,.disabled)]:opacity-60 px-3 py-1.5 text-xs bg-accent-500 text-white hover:text-bolt-elements-item-contentAccent [&:not(:disabled,.disabled)]:hover:bg-bolt-elements-button-primary-backgroundHover outline-accent-500 flex gap-1.5"
            title="Download Debug Log"
          >
            <div className="i-ph:download" />
            <span>Debug Log</span>
          </button>
        </div>
      )}
    </div>
  );
}
