import { WebsocketClient } from "@/communication/WebsocketClient";
import Popup from "@/components/Popup/Popup";
import { Logger } from "@/utils/log-utils";
import { getCookie, setCookie } from "cookies-next";
import Image from "next/image";
import { useRouter } from "next/router";
import { use, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

type CustomError = Error & { data: { uuid: string } };

export default function Index() {
	const logger = new Logger("client/index");
	const router = useRouter();
	const [cookieToken, setCookieToken] = useState<string | null>(null);

	const validatedWsClient = useRef<WebsocketClient>(
		new WebsocketClient(
			`${process.env.NEXT_PUBLIC_WS_SERVER_URL}/${process.env.NEXT_PUBLIC_WS_VALIDATED_NAMESPACE}`,
			getCookie("token") as string || "",
		),
	);


	validatedWsClient?.current?.socket.on("connect", () => {
		logger.log("Validated connected");
	});
	validatedWsClient?.current?.socket.on("disconnect", () => {
		logger.log("Validated disconnected");
	});
	validatedWsClient?.current?.socket.on("connect_error", (err: Error) => {
		logger.log("Validated connection error", err);
	});

	validatedWsClient?.current?.socket.on(
		"register_new_player_token",
		(data: { token: string }) => {
			logger.log("Register new player token", data.token);
			setCookie("token", data.token, {
				sameSite: "strict",
				secure: true,
				maxAge: 60 * 60 * 24, // 1 day
			});
			validatedWsClient?.current?.socket.emit("token_test");
		},
	);

	validatedWsClient?.current?.socket.on(
		"entered_game",
		(data: { roomCode: string; toastMessage: string }) => {
			logger.log("Entered game", data.roomCode);
			toast(data.toastMessage);
			router.push(`/room/${data.roomCode}`);
		},
	);

	return (
		<>
			<div className="flex flex-col items-center justify-center min-h-screen">
				<h1 className="text-4xl font-bold">Odd Duck</h1>
				<Image
					src="/avatars/odd_duck.webp"
					alt="Odd Duck"
					width={200}
					height={200}
				/>
				<div className="flex flex-col items-center w-full gap-2">
					<Popup
						buttonTitle="Create Game"
						triggerButtonClick={() => {
							validatedWsClient?.current?.socket.emit(
								"check_if_already_created_game_before",
							);
						}}
						dialogTitle="Create Game"
						dialogDescription="What be your name veary traveller?"
						submitButtonTitle="Create Game"
						inputs={[
							{
								id: "name",
								type: "text",
								labelTitle: "Name",
								placeholder: "Name",
								required: true,
								minLength: 1,
								maxLength: 20,
								className: "col-span-3",
							},
						]}
						submitButtonOnClick={(e) => {
							e.preventDefault();
							logger.log("Create game clicked");
							const name = (document.getElementById("name") as HTMLInputElement)
								.value;
							logger.log("Name", name);
							if (!name) {
								return;
							}

							logger.log("Name", name.length);

							if (name.length < 1 || name.length > 20) {
								return;
							}

							logger.log("creating game...", name);

							validatedWsClient?.current?.socket.emit("create_game", {
								name: name,
							});
						}}
					/>

					<Popup
						buttonTitle="Join Game"
						dialogTitle="Join Game"
						dialogDescription="What be your name veary traveller? And what be the code to the room ye be joinin?"
						submitButtonTitle="Join Game"
						inputs={[
							{
								id: "name",
								type: "text",
								placeholder: "Name",
								labelTitle: "Name",
								required: true,
								minLength: 1,
								maxLength: 20,
								className: "col-span-3",
								onChange: (e) => {
									// must be 6 characters long, most be upper case
									const value = e.target.value.trim();
									if (!value) {
										return;
									}

									if (value.length > 20) {
										e.target.value = value.slice(0, 20);
									}
								},
							},
							{
								id: "code",
								type: "text",
								placeholder: "Code",
								labelTitle: "Code",
								required: true,
								minLength: 3,
								maxLength: 20,
								className: "col-span-3",
								onChange: (e) => {
									// must be 6 characters long, most be upper case
									const value = e.target.value.trim();
									if (!value) {
										return;
									}
									const formattedValue = value.toUpperCase();
									e.target.value = formattedValue;

									if (formattedValue.length > 6) {
										e.target.value = formattedValue.slice(0, 6);
									}
								},
							},
						]}
						submitButtonOnClick={(e) => {
							e.preventDefault();
							const name = (document.getElementById("name") as HTMLInputElement)
								.value;
							const code = (document.getElementById("code") as HTMLInputElement)
								.value;

							if (!name || !code) {
								return;
							}

							if (name.length < 1 || name.length > 20) {
								return;
							}

							if (code.length !== 6) {
								return;
							}

							validatedWsClient?.current?.socket.emit("join_game", {
								name: name,
								code: code,
							});
						}}
					/>
				</div>
			</div>
		</>
	);
}
