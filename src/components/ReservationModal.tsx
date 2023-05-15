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
import { addMinutes, getTime } from "date-fns";
import format from "date-fns/format";
import { useAtom } from "jotai";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import React, { useCallback, useRef, useState } from "react";
import { Stack } from "react-daisyui";
import { selectedRoomAtom } from "~/atoms";
import { Availability, RoomWithAvailability } from "~/server/api/routers/room";
import { api } from "~/utils/api";

interface Props {
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  availability: Availability[];
  roomId: string;
}
const ReservationModal = ({
  isOpen,
  onOpen,
  onClose,
  availability,
  roomId,
}: Props) => {
  const [range, setRange] = useState<[number, number]>([0, 2]);
  const timeList = useRef<Date[]>([]);

  const getTimeList = useCallback(() => {
    // new dat
    const currTimeList: Date[] = [];
    const currentDate = new Date();

    if (currentDate.getMinutes() < 30) {
      currTimeList.push(new Date(currentDate.setMinutes(30)));
    } else {
      currentDate.setHours(currentDate.getHours() + 1);
      currentDate.setMinutes(0);
      currTimeList.push(new Date(currentDate));
    }
    for (let i = 0; i < 12; i++) {
      currTimeList.push(
        addMinutes(currTimeList[currTimeList.length - 1] as Date, 30)
      );
    }
    console.log(currTimeList);

    timeList.current = currTimeList;
    let obj: Record<number, string> = {};
    for (const [idx, t] of currTimeList.entries()) {
      obj[idx * 2] = format(t, "hh:mm");
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
                defaultValue={[0, 2]}
                onChange={(r) => setRange(r as [number, number])}
              />
            </FormControl>
          </Flex>
        </ModalBody>

        <ModalFooter gap={2}>
          <Button variant="ghost">Cancelar</Button>
          <Button
            colorScheme="green"
            mr={3}
            isLoading={isLoading}
            onClick={() =>
              mutate({
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
