import { type NextPage } from "next";
import Head from "next/head";

import { api } from "~/utils/api";
import { TransformWrapper } from "react-zoom-pan-pinch";
import { TransformComponent } from "react-zoom-pan-pinch";
import SideCard from "~/components/SideCard";
import { useEffect, useRef, useState } from "react";
import { map } from "@trpc/server/observable";
import RoomHighlight from "~/components/RoomHighlight";
import { useAtom } from "jotai";
import { selectedRoomAtom } from "~/atoms";
import { AnimatePresence } from "framer-motion";
import { getRelativeDimensions } from "~/components/highlightCoordinates";
import { roomRouter } from "~/server/api/routers/room";
import { signIn, signOut, useSession } from "next-auth/react";
import Google from "next-auth/providers/google";

const scale = 1.2;
const Home: NextPage = () => {
  const { status, data } = useSession();
  const [loaded, setLoaded] = useState(false);
  const [mapRef, setMapRef] = useState<HTMLDivElement | null>(null);

  const [rect, setRect] = useState<{ width: number; height: number } | null>(
    null
  );
  const [selectedRoom] = useAtom(selectedRoomAtom);

  useEffect(() => {
    setTimeout(() => {
      if (mapRef == null) return;
      const rect = mapRef?.getBoundingClientRect();
      setRect({ width: rect?.width ?? 0, height: rect?.height ?? 0 });
    }, 500);
  }, [mapRef, status]);

  const { data: rooms } = api.room.getRooms.useQuery();

  if (status == "loading") return <></>;
  if (status == "unauthenticated") return signIn("google");
  return (
    <>
      <Head>
        <title>Cubisave</title>
        <meta name="description" content="Cubisave" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="fixed z-10 m-10 ">
        <h1 className="text-4xl font-bold">Cubisave</h1>
        <h2>Biblioteca CETYS</h2>
      </div>
      <div
        className="fixed right-2 z-10 m-10 flex cursor-pointer items-center gap-2"
        onClick={() => signOut()}
      >
        <h1 className="text-lg">{data?.user.name}</h1>
        <img
          src={data?.user.image ?? ""}
          alt=""
          className="w-12 rounded-full"
        />
      </div>

      <TransformWrapper
        onInit={() => setLoaded(true)}
        initialScale={scale}
        centerOnInit
      >
        <TransformComponent>
          <div
            className=" flex h-[100vh] w-[100vw] items-center justify-center transition-all duration-500"
            style={{ opacity: loaded ? "100" : "0" }}
          >
            <div
              style={{ height: "90vh" }}
              ref={(ref) => setMapRef(ref)}
              className="relative"
            >
              <img
                src="/Cubisave.svg"
                alt="hola"
                className="h-full w-full bg-cover"
              />
              {rooms &&
                rect != null &&
                getRelativeDimensions(
                  rect.width,
                  rect.height,
                  scale,
                  rooms
                ).map((highlightCoordinates) => (
                  <RoomHighlight
                    key={highlightCoordinates.id}
                    id={String(highlightCoordinates.id)}
                    name={highlightCoordinates.name}
                    available={true}
                    height={highlightCoordinates.height}
                    width={highlightCoordinates.width}
                    x={highlightCoordinates.x}
                    y={highlightCoordinates.y}
                  />
                ))}
            </div>
          </div>
        </TransformComponent>
      </TransformWrapper>
      <AnimatePresence>
        {selectedRoom != "" && <SideCard rooms={rooms ?? []} />}
      </AnimatePresence>
    </>
  );
};

export default Home;
