import { WebsocketClient } from "@/communication/WebsocketClient";
import { Logger } from "@/utils/log-utils";
import Image from "next/image";
import Popup from "@/components/Popup/dialog";
import { getCookie, setCookie } from "cookies-next";
import { useState } from "react";

export default function Index() {

	const [cookieToken, setCookieToken] = useState<string | null>(getCookie("token") as string || null);
	const newPlayerWsClient = new WebsocketClient(
		`${process.env.NEXT_PUBLIC_WS_SERVER_URL}/${process.env.NEXT_PUBLIC_WS_NEW_PLAYER_NAMESPACE}`,
		cookieToken|| "",
	);
	let validatedWsClient: WebsocketClient | null = null;

	const logger = new Logger("Client");

	newPlayerWsClient.socket.on("connect", () => {
		logger.log("Connected to server");
	});
	newPlayerWsClient.socket.on("connect_error ", (err: unknown) => {
		logger.log("Connection error", err);
		logger.log("Connection error");
	});
	newPlayerWsClient.socket.on("disconnect", () => {
		logger.log("Disconnected from server");
	});

	newPlayerWsClient.socket.on("new_player", (data: { uuid: string }) => {
		setCookie("token", data.uuid, {
			sameSite: "strict",
			secure: true,
			maxAge: 60 * 60 * 24, // 24 hours
		})
		// set new token
		validatedWsClient = new WebsocketClient(
			`${process.env.NEXT_PUBLIC_WS_SERVER_URL}/${process.env.NEXT_PUBLIC_WS_VALIDATED_NAMESPACE}`,
			data.uuid,
		);
		newPlayerWsClient.socket.disconnect();
	});


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
								}
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
							const name = (document.getElementById("name") as HTMLInputElement).value;
							const code = (document.getElementById("code") as HTMLInputElement).value;

							if (!name || !code) {
								return;
							}

							if (name.length < 1 || name.length > 20) {
								return;
							}

							if (code.length !== 6) {
								return;
							}

							validatedWsClient?.socket.emit("join_game", {
								token: cookieToken,
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
