import * as Sentry from "@sentry/react-router/cloudflare";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

Sentry.init({
	dsn: "https://0059254ef5a4ea86918e8a1721f51288@o4511000575541248.ingest.us.sentry.io/4511000584192000",
});
startTransition(() => {
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
	);
});
