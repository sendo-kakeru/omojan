import * as Sentry from "@sentry/react-router/cloudflare";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

Sentry.init({
	dsn: "https://0059254ef5a4ea86918e8a1721f51288@o4511000575541248.ingest.us.sentry.io/4511000584192000",
	// Adds request headers and IP for users, for more info visit:
	// https://docs.sentry.io/platforms/javascript/guides/react-router/configuration/options/#sendDefaultPii
	sendDefaultPii: true,
});
startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
	);
});
