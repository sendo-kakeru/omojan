import { use } from "react";

import { MeContext } from "./provider";

export function useMe() {
	const context = use(MeContext);
	if (!context) throw new Error("Context has not been provided.");
	return context;
}
