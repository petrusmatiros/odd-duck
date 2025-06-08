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
	DialogClose,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { hsl } from "@/styles/utils";
import type { VariantProps } from "class-variance-authority";

interface Props {
	open?: boolean;
	triggerButton?: {
		buttonTitle: string;
		buttonVariant: VariantProps<typeof Button>["variant"];
		triggerButtonClick?: (
			e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		) => void;
	};
	dialog: {
		dialogTitle: string;
		dialogDescription: string;
	};
	inputs?: {
		id: string;
		value?: string;
		type: string;
		labelTitle?: string;
		placeholder?: string;
		required?: boolean;
		minLength?: number;
		maxLength?: number;
		className?: string;
		onClick?: (e: React.MouseEvent<HTMLInputElement, MouseEvent>) => void;
		onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
	}[];
	submitButton: {
		submitButtonTitle: string;
		submitButtonOnClick?: (
			e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		) => void;
	};
	closeButton?: {
		closeButtonTitle: string;
		closeButtonOnClick?: (
			e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
		) => void;
	};
}

export default function Popup({
	open,
	triggerButton,
	dialog: { dialogTitle, dialogDescription },
	inputs,
	submitButton: { submitButtonTitle, submitButtonOnClick },
	closeButton,
}: Props) {
	return (
		<Dialog open={open}>
			{triggerButton?.buttonTitle && (
				<DialogTrigger asChild>
					{triggerButton?.buttonTitle && (
						<Button
							variant={triggerButton?.buttonVariant}
							style={{
								paddingInline: "1rem",
								width: "10rem",
							}}
							onClick={triggerButton?.triggerButtonClick}
						>
							{triggerButton?.buttonTitle}
						</Button>
					)}
				</DialogTrigger>
			)}
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
								value={input.value}
								maxLength={input.maxLength}
								minLength={input.minLength}
								placeholder={input.placeholder}
								className={clsx("col-span-3", input.className)}
								required={input.required}
								onChange={input.onChange}
								onClick={input.onClick}
								style={{
									padding: "0.5rem",
									backgroundColor: hsl(255, 255, 255, 100),
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										submitButtonOnClick?.(
											e as unknown as React.MouseEvent<
												HTMLButtonElement,
												MouseEvent
											>,
										);
									}
								}}
							/>
						</div>
					))}
				</div>
				<DialogFooter>
					{closeButton?.closeButtonTitle && (
						<DialogClose asChild>
							<Button
								type="button"
								variant="secondary"
								onClick={closeButton?.closeButtonOnClick}
							>
								{closeButton?.closeButtonTitle || "Close"}
							</Button>
						</DialogClose>
					)}
					{submitButtonTitle && (
						<Button
							type="submit"
							style={{ paddingInline: "1rem" }}
							onClick={submitButtonOnClick}
						>
							{submitButtonTitle}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
