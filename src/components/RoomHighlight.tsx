import React, { useState } from "react";
import SideCard from "./SideCard";
import { useAtom } from "jotai";
import { selectedRoomAtom } from "~/atoms";
import { motion } from "framer-motion";

const bigWidth = 176;
const bigHeight = 162.5;

const smallWidth = 153;
const smallHeight = 97;

const margin = 2;

interface Props {
  id: string;
  name: string;
  available: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
}
const RoomHighlight = ({ id, name, available, height, width, x, y }: Props) => {
  const color = available ? "bg-green-500/80" : "bg-red-500/80";
  const hoverColor = available ? "hover:bg-green-500" : "hover:bg-red-500";
  const [selectedRoomId, setSelectedRoomId] = useAtom(selectedRoomAtom);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div
        className={`hover:z-100 absolute z-10 flex cursor-pointer items-center justify-center border-[0.5px] border-black shadow-lg transition-all hover:z-20 hover:scale-105  ${color} ${hoverColor}`}
        style={{
          left: x,
          top: y,
          width: width,
          height: height,
        }}
        onClick={() => setSelectedRoomId(id)}
      >
        {name}
      </div>
    </motion.div>
  );
};

export default RoomHighlight;
