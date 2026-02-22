import {
	IMAGE_DIMENSION_MAX,
	IMAGE_DIMENSION_MIN,
} from "@repo/shared/constants/image";
import {
	type InferOutput,
	object,
	optional,
	pipe,
	rawTransform,
	string,
} from "valibot";

const stringToInt = (minVal: number, maxVal: number) =>
	pipe(
		string(),
		rawTransform(({ dataset, addIssue, NEVER }) => {
			const num = Number.parseInt(dataset.value, 10);
			if (Number.isNaN(num)) {
				addIssue({ message: "数値で入力してください" });
				return NEVER;
			}
			if (num < minVal) {
				addIssue({ message: `${minVal}以上で入力してください` });
				return NEVER;
			}
			if (num > maxVal) {
				addIssue({ message: `${maxVal}以下で入力してください` });
				return NEVER;
			}
			return num;
		}),
	);

export const imageDeliveryQuerySchema = object({
	h: optional(stringToInt(IMAGE_DIMENSION_MIN, IMAGE_DIMENSION_MAX)),
	w: optional(stringToInt(IMAGE_DIMENSION_MIN, IMAGE_DIMENSION_MAX)),
});

export type ImageDeliveryQuery = InferOutput<typeof imageDeliveryQuerySchema>;
