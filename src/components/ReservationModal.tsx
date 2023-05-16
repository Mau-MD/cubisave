import {
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Modal,
  FormControl,
  FormLabel,
  Input,
  RadioGroup,
  Radio,
  Flex,
  useToast,
} from "@chakra-ui/react";
import { addMinutes, differenceInMinutes, getTime } from "date-fns";
import format from "date-fns/format";
import { useAtom } from "jotai";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Stack } from "react-daisyui";
import { selectedRoomAtom } from "~/atoms";
import { Availability, RoomWithAvailability } from "~/server/api/routers/room";
import { api } from "~/utils/api";

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  roomId: string;
  startDateTime?: Date;
  endDateTime?: Date;
  reservationId?: string;
}
const ReservationModal = ({
  isOpen,
  onOpen,
  onClose,
  roomId,
  reservationId,
  startDateTime,
  endDateTime,
}: Props) => {
  function round(date: Date) {
    const dateCopy = new Date(date);
    if (dateCopy.getMinutes() === 0) return dateCopy;
    if (dateCopy.getMinutes() <= 30) {
      dateCopy.setMinutes(30);
    } else {
      dateCopy.setHours(dateCopy.getHours() + 1);
      dateCopy.setMinutes(0);
    }
    return dateCopy;
  }
  const [range, setRange] = useState<[number, number]>(getInitialState());
  const timeList = useRef<Date[]>([]);

  function getInitialState(): [number, number] {
    if (!startDateTime || !endDateTime) return [0, 2];

    let range: [number, number] = [0, 0];
    if (startDateTime < new Date()) range[0] = 0;
    else
      range[0] =
        Math.floor(differenceInMinutes(startDateTime, new Date()) / 15) - 1;

    const roundedEndDate = round(endDateTime);
    const roundedCurrentDate = round(new Date());

    console.log(
      format(roundedEndDate, "hh:mm"),
      format(roundedCurrentDate, "hh:mm")
    );
    const diff = differenceInMinutes(roundedEndDate, roundedCurrentDate);
    console.log(diff);
    const interval = Math.ceil(diff / 15);
    range[1] = interval;
    return range;
  }
  const getTimeList = useCallback(() => {
    // new dat
    const currTimeList: Date[] = [];
    const currentDate = round(new Date());

    currTimeList.push(currentDate);

    for (let i = 0; i < 24; i++) {
      currTimeList.push(
        addMinutes(currTimeList[currTimeList.length - 1] as Date, 15)
      );
    }
    console.log(currTimeList);

    timeList.current = currTimeList;
    let obj: Record<number, string> = {};
    for (const [idx, t] of currTimeList.entries()) {
      if (idx % 2 == 1) continue;
      obj[idx] = format(t, "hh:mm");
    }
    return obj;
  }, []);

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

  const { mutate: mutateUpdate, isLoading: isLoadingUpdate } =
    api.room.updateReservation.useMutation({
      onSuccess: () => {
        onClose();
        room.getRooms.invalidate();
        room.getReservation.invalidate();
        setSelectedRoom("");
        toast({
          status: "success",
          title: "Reserva actualizada",
          description: "Reserva actualizada con éxito",
        });
      },
      onError: (err) => {
        toast({
          status: "error",
          title: "Error al actualizar reserva",
          description: err.message,
        });
      },
    });

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size={"3xl"}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Programar Reserva</ModalHeader>
        <ModalCloseButton />

        <ModalBody>
          <Flex gap={5} flexDirection="column">
            <FormControl mb={5}>
              <FormLabel>
                {((range[1] - range[0]) * 30) / 2} minutos seleccionados
              </FormLabel>
              <Slider
                range
                dots
                step={1}
                min={0}
                max={12 * 2}
                marks={getTimeList()}
                defaultValue={range}
                onChange={(r) => setRange(r as [number, number])}
              />
            </FormControl>
          </Flex>
        </ModalBody>

        <ModalFooter gap={2}>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            colorScheme="green"
            mr={3}
            isLoading={isLoading || isLoadingUpdate}
            onClick={() =>
              endDateTime && startDateTime
                ? mutateUpdate({
                    endDateTime: timeList.current[range[1]] as Date,
                    startDateTime: timeList.current[range[0]] as Date,
                    reservationId: reservationId ?? "",
                    roomId: roomId,
                  })
                : mutate({
                    roomId: roomId,
                    startDateTime: timeList.current[range[0]] as Date,
                    endDateTime: timeList.current[range[1]] as Date,
                  })
            }
          >
            Programar Reserva
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReservationModal;
