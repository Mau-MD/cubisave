import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowBigLeft } from "lucide-react";
import Image from "next/image";
import SideHours, { SideHoursState } from "./SideHours";
import { useAtom } from "jotai";
import { selectedRoomAtom } from "~/atoms";
import { Room } from "@prisma/client";
import {
  RoomWithAvailability,
  RoomWithReservations,
} from "~/server/api/routers/room";
import ReservationModal from "./ReservationModal";
import { useDisclosure, useToast } from "@chakra-ui/react";
import { addMinutes, differenceInMinutes, sub } from "date-fns";
import { api } from "~/utils/api";

interface PropTypes {
  position?: "left" | "right";
  rooms: RoomWithAvailability[];
}
const SideCard = ({ position = "right", rooms }: PropTypes) => {
  const [selected, setSelected] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useAtom(selectedRoomAtom);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId),
    [selectedRoomId]
  );

  const { isOpen, onOpen, onClose } = useDisclosure();

  const toast = useToast();
  const { room } = api.useContext();
  const [_, setSelectedRoom] = useAtom(selectedRoomAtom);

  const { mutate, isLoading } = api.room.makeReservation.useMutation({
    onSuccess: () => {
      onClose();
      room.getRooms.invalidate();
      setSelectedRoom("");
      toast({
        status: "success",
        title: "Reserva realizada",
        description: "Reserva realizada con éxito",
      });
    },
    onError: (err) => {
      toast({
        status: "error",
        title: "Error al realizar reserva",
        description: err.message,
      });
    },
  });

  const timeLeft = Math.min(
    30,
    differenceInMinutes(
      selectedRoom?.Reservation[0]?.startDateTime ?? addMinutes(new Date(), 30),
      new Date()
    )
  );

  function handleReservation() {
    mutate({
      roomId: selectedRoom?.id ?? "",
      startDateTime: new Date(),
      endDateTime: addMinutes(new Date(), timeLeft - 1),
    });
  }

  return (
    <>
      <motion.div
        initial={{ x: position === "right" ? window.innerWidth : -400 }}
        exit={{ x: position === "right" ? window.innerWidth : -400 }}
        animate={{ x: position === "right" ? window.innerWidth - 410 : 0 }}
        className={`fixed bottom-0 
       top-0 z-30 m-10 flex w-[350px] flex-col rounded-md bg-white p-8 shadow-md`}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{selectedRoom?.name}</h2>
          <motion.div animate={{ rotate: position === "right" ? 180 : 0 }}>
            <ArrowBigLeft
              className="cursor-pointer"
              onClick={() => setSelectedRoomId("")}
            />
          </motion.div>
        </div>
        {timeLeft <= 0 && (
          <div className="mb-4 mt-2 w-fit rounded-lg bg-red-200 px-2 text-sm text-red-800">
            Ocupado los siguientes{" "}
            {differenceInMinutes(
              selectedRoom?.Reservation[0]?.endDateTime ?? new Date(),
              new Date()
            )}{" "}
            minutos
          </div>
        )}
        <div className="mt-4 flex h-full flex-col overflow-hidden">
          <div className="relative h-[200px] w-full rounded-md">
            <Image
              src={
                selectedRoom?.image ??
                "https://www.cetys.mx/biblioteca/images/ensenada04.jpg"
              }
              className="h-full w-full rounded-md object-cover"
              fill
              alt="image"
            />
          </div>

          <h3 className="my-2 text-lg font-bold">Próximas Reservas</h3>
          <div className="hour-divider z-0 flex h-[50%] flex-col overflow-y-scroll rounded-b-md rounded-t-md">
            {selectedRoom?.availability.map((reservation) => (
              <SideHours
                key={reservation.id}
                timeStart={reservation.startDateTime}
                timeFinish={reservation.endDateTime}
                state={
                  selected === reservation.id
                    ? SideHoursState.SELECTED
                    : reservation.available
                    ? SideHoursState.AVAILABLE
                    : SideHoursState.UNAVAILABLE
                }
                onClick={() => setSelected(reservation.id)}
              />
            ))}
            {/* {sideHoursData.map((item, index) => (
            <SideHours
              key={index}
              state={
                selected === item.id
                  ? SideHoursState.SELECTED
                  : item.available
                  ? SideHoursState.AVAILABLE
                  : SideHoursState.UNAVAILABLE
              }
              timeStart={item.timeStart}
              timeFinish={item.timeFinish}
              onClick={() => setSelected(item.id)}
            />
          ))} */}
          </div>
          <div className="mt-auto flex flex-col gap-2 ">
            <div
              className=" cursor-pointer rounded-md border-2 border-green-500 px-4 py-2 text-center  text-green-500"
              onClick={onOpen}
            >
              Programar Reserva
            </div>
            {timeLeft > 0 && (
              <div
                className=" cursor-pointer rounded-md bg-green-500 px-4 py-2 text-center font-bold text-white shadow-lg shadow-green-500/50"
                onClick={() => handleReservation()}
              >
                Reservar por{" "}
                {Math.min(
                  30,
                  differenceInMinutes(
                    selectedRoom?.Reservation[0]?.startDateTime ??
                      addMinutes(new Date(), 30),
                    new Date()
                  )
                )}{" "}
                minutos
              </div>
            )}
          </div>
        </div>
      </motion.div>
      <ReservationModal
        onClose={onClose}
        onOpen={onOpen}
        isOpen={isOpen}
        roomId={selectedRoom?.id ?? ""}
      />
    </>
  );
};

export default SideCard;
