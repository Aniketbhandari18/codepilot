"use client";

import { useEffect } from "react";
import { setupConnect } from "@webcontainer/api/connect";

/**
 * WebContainer standalone preview connection bridge.
 *
 * This page is required to be able to open WebContainer previews in a seperate browser tab instead of an iframe within the app. This is because when a WebContainer preview is opened in a seperate tab, it loses the connection to the parent app that is required for the preview to load and work properly. By opening this page as a bridge between the WebContainer preview and the parent app, we can ensure that the connection is maintained and the preview works as expected even in a seperate tab.
 *
 * This route handler acts as a proxy page when a user opens a WebContainer
 * preview URL in a completely separate browser tab instead of an iframe.
 *
 * Path alignment requirement: /webcontainer/connect/[id]
 *
 *
 * // https://github.com/stackblitz/webcontainer-core/issues/1725
 */

export default function WebContainerConnectPage() {
  useEffect(() => {
    try {
      setupConnect();
    } catch (error) {
      console.error("Failed to connect standalone preview tab:", error);
    }
  }, []);

  return null; // This page doesn't need to render anything
}
