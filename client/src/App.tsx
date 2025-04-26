import { Route, Routes } from "react-router";
import "./App.css"
import IndexPage from "./routes/IndexPage";
import RoomPage from "./routes/RoomPage";

function App() {
	return (
		<>
			<Routes>
				<Route path="/" element={<IndexPage />} />
				<Route path="/room/:code" element={<RoomPage />} />
			</Routes>
		</>
	);
}

export default App;
