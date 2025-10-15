import { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { Button } from "~/components/button/Button";
import { CreateRoomDialog } from "./_components/CreateRoomDialog";

export default function () {
	const [isOpen, setIsOpen] = useState(false);
	return (
		<>
			<div className="grid gap-y-8">
				<Button
					as="button"
					className="w-fit justify-self-end"
					leftIcon={<FaPlus />}
					onClick={() => setIsOpen(true)}
				>
					部屋作成
				</Button>
			</div>
			<CreateRoomDialog isOpen={isOpen} setIsOpen={setIsOpen} />
		</>
	);
}
