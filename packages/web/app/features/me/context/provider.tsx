import type { Me } from "@repo/shared/model/me";
import type { HttpResponseBody } from "@repo/shared/types";
import type { InferRequestType } from "hono";
import { createContext, type PropsWithChildren } from "react";
import type { KeyedMutator } from "swr";
import useSWRImmutable from "swr/immutable";
import { honoClient } from "~/libs/apiClient.client";

type MutateArgs = Parameters<KeyedMutator<HttpResponseBody<Me | null>>>;

export const MeContext = createContext<{
	me: Me | null;
	isLoading: boolean;
	mutate: (...args: MutateArgs) => Promise<void>;
} | null>(null);

async function fetcher(args: InferRequestType<typeof honoClient.me.$get>) {
	const response = await honoClient.me.$get(args);
	return await response.json();
}

export function MeProvider({ children }: PropsWithChildren) {
	const { data, error, isLoading, mutate } = useSWRImmutable("/me", fetcher);
	return (
		<MeContext
			value={{
				isLoading,
				me: !error && data?.data ? data.data : null,
				mutate: async (...args: MutateArgs) => {
					await mutate(...args);
				},
			}}
		>
			{children}
		</MeContext>
	);
}
