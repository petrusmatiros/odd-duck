import clsx from "clsx";
import { Button } from "../ui/button";
import {
	DialogHeader,
	DialogFooter,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogTitle,
	DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { hsl } from "@/styles/utils";

interface Props {
	buttonTitle: string;
	dialogTitle: string;
	dialogDescription: string;
	submitButtonTitle: string;
	inputs: {
		id: string;
		type: string;
		labelTitle?: string;
		placeholder?: string;
		required?: boolean;
		minLength?: number;
		maxLength?: number;
		className?: string;
		onSubmit?: () => void;
		onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	}[];
}

export default function Popup({
	buttonTitle,
	dialogTitle,
	dialogDescription,
	submitButtonTitle,
	inputs,
}: Props) {
	return (
		<Dialog>
			<DialogTrigger asChild>
				{buttonTitle && <Button variant="outline" style={{
					paddingInline: "1rem",
					width: "10rem",
				}}>{buttonTitle}</Button>}
			</DialogTrigger>
			<DialogContent
				className="sm:max-w-[425px]"
				style={{
					padding: "1rem",
				}}
			>
				<DialogHeader>
					{dialogTitle && <DialogTitle>{dialogTitle}</DialogTitle>}
					{dialogDescription && (
						<DialogDescription>{dialogDescription}</DialogDescription>
					)}
				</DialogHeader>
				<div className="grid gap-4 py-4">
					{inputs?.map((input) => (
						<div className="grid grid-cols-4 items-center gap-4" key={input.id}>
							{input.labelTitle && (
								<label
									htmlFor={input.id}
									className="text-sm font-medium text-gray-900 dark:text-gray-300"
								>
									{input.labelTitle}
								</label>
							)}
							<Input
								id={input.id}
								type={input.type}
								maxLength={input.maxLength}
								minLength={input.minLength}
								placeholder={input.placeholder}
								className={clsx("col-span-3", input.className)}
								required={input.required}
								onChange={input.onChange}
								onSubmit={input.onSubmit}
								style={{
									padding: "0.5rem",
									backgroundColor: hsl(255, 255, 255, 100),
								}}
							/>
						</div>
					))}
				</div>
				<DialogFooter>
					{submitButtonTitle && (
						<Button type="submit" style={{ paddingInline: "1rem" }}>
							{submitButtonTitle}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
