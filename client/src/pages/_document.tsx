import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
	return (
		<Html lang="en">
			<Head>
        <title>Odd Duck</title>
        <meta name="title" content="Odd Duck" />
        <meta name="description" content="Odd Duck - A spyfall-like game to play with friends!" />
        <meta name="keywords" content="Odd Duck, game, fun, friends, spyfall, spyfall online" />
				<link rel="icon" href="/favicon.webp" />
			</Head>
			<body className="antialiased">
				<Main />
				<NextScript />
			</body>
		</Html>
	);
}
