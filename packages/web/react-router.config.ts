import type { Config } from "@react-router/dev/config";

export default {
	prerender: ["/guide", "/privacy", "/terms"],
	ssr: true,
} satisfies Config;
