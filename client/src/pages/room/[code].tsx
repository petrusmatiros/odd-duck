
export default function Page(ctx: {
  code: string;
}) {
  const { code } = ctx;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">Odd Duck</h1>
      <p className="text-2xl font-bold">Room Code: {code}</p>
      {/* <Image
        src="/images/odd-duck.png"
        alt="Odd Duck"
        width={500}
        height={500}
      /> */}
    </div>
  );
  
}