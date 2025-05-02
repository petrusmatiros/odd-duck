import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { WebsocketClient } from "../communication/WebsocketClient";
import Popup from "../components/Popup/Popup";
import { getCookie, setCookie } from "../utils/cookie-utils";
import { Logger } from "../utils/log-utils";
import { Howl } from "howler";


	export default function Index() {
		const [oddDuckImageSrc, setOddDuckImageSrc] = useState(
			"avatars/odd_duck_open.webp",
		);
		const sound = new Howl({
			src: ["odd_duck_theme.mp3"],
			volume: 0.3,
			loop: true,
		});

		// Clear listener after first call.
		sound.once("load", () => {
			console.log("Sound loaded");
			sound.play();
		});

		// Fires when the sound finishes playing.
		sound.on("end", () => {
			console.log("Finished!");
		});
		const logger = new Logger("client/index");

		const validatedWsClient = useRef<WebsocketClient>(
			new WebsocketClient(
				`${import.meta.env.VITE_WS_SERVER_URL}/${import.meta.env.VITE_WS_VALIDATED_NAMESPACE}`,
				(getCookie("token") as string) || "",
			),
		);

		// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
		useEffect(() => {
			const interval = setInterval(() => {
				const openEyesSrc = "avatars/odd_duck_open.webp";
				const closedEyesSrc = "avatars/odd_duck_closed.webp";

				// open eyes should always be, but every 5 seconds, should be 30% chance to be closed, then quickly open again
				const randomNum = Math.random();
				let newImage = openEyesSrc;
				if (randomNum < 0.45) {
					newImage = closedEyesSrc;
				}
				const img = document.getElementById(
					"odd-duck-image",
				) as HTMLImageElement;
				if (img) {
					img.src = newImage;
				}

				setTimeout(() => {
					if (img) {
						img.src = openEyesSrc;
					}
				}, 250);
			}, 5000);
			return () => {
				clearInterval(interval);
				sound.stop();
			};
		// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
		useEffect(() => {
			if (!validatedWsClient?.current) {
				return;
			}
			const sockRef = validatedWsClient?.current.socket;

			sockRef.on("connect", () => {
				logger.log("Validated socket connected");
			});
			sockRef.on("disconnect", () => {
				logger.log("Validated socket disconnected");
			});
			sockRef.on("connect_error", (err: Error) => {
				logger.log("Validated socket connection error", err);
			});

			sockRef.on(
				"register_new_player_token_response",
				(data: { token: string }) => {
					logger.log("Register new player token", data.token);
					setCookie("token", data.token, {
						sameSite: "Strict",
						secure: true,
						maxAge: 60 * 60 * 24, // 1 day
					});
				},
			);

			sockRef.on(
				"entered_game_response",
				(data: { roomCode: string; toastMessage: string }) => {
					logger.log("Entered game", data.roomCode);
					toast(data.toastMessage);
					window.location.href = `/room/${data.roomCode}`;
				},
			);

			return () => {
				logger.log("Cleaning up socket listeners");
				sockRef.off("connect");
				sockRef.off("disconnect");
				sockRef.off("connect_error");
				sockRef.off("register_new_player_token_response");
				sockRef.off("entered_game_response");
			};
		// eslint-disable-next-line react-hooks/exhaustive-deps
		}, []);

		return (
			<>
				<div className="flex flex-col items-center justify-center min-h-screen">
					<h1 className="text-4xl font-bold">Odd Duck</h1>
					<img
					id="odd-duck-image"
						src={"avatars/odd_duck_open.webp"}
						alt="Odd Duck"
						width={200}
						height={200}
					/>
					<div className="flex flex-col items-center w-full gap-2">
						<Popup
							buttonTitle="Create Game"
							triggerButtonClick={() => {
								logger.log("Create game clicked");
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
