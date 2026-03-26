import classNames from "classnames";
import { LuLoaderCircle } from "react-icons/lu";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
	return (
		<LuLoaderCircle
			aria-label="Loading"
			className={classNames("animate-spin", className)}
			role="status"
			{...props}
		/>
	);
}

export { Spinner };
