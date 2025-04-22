import { Logger } from "@/utils/log-utils";
import { useRouter } from "next/router";

export default function Page() {
  const router = useRouter();

  const logger = new Logger("client/room/code");

  const roomCode = router.query?.code;

  if (!roomCode) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">Odd Duck</h1>
      <p className="text-2xl font-bold">Room Code: {roomCode}</p>
      {/* <Image
        src="/images/odd-duck.png"
        alt="Odd Duck"
        width={500}
        height={500}
      /> */}
    </div>
  );
  
}