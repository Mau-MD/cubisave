import { Room } from "@prisma/client";

const svgWidth = 758.33;
const svgHeight = 1045.42;

const highlightCoordinates = [
  {
    id: 1,
    x: 548.1,
    y: 150.03,
    width: 200,
    height: 186,
  },
  {
    id: 2,
    x: 573.18,
    y: 335.63,
    width: 175,
    height: 111.8,
  },
  {
    id: 3,
    x: 572.94,
    y: 446.94,
    width: 175,
    height: 111.8,
  },
  {
    id: 4,
    x: 572.94,
    y: 558.94,
    width: 175,
    height: 111.8,
  },
  {
    id: 5,
    x: 572.94,
    y: 669.94,
    width: 175,
    height: 111.8,
  },
  {
    id: 6,
    x: 572.94,
    y: 781.94,
    width: 175,
    height: 113.09,
  },
  {
    id: 7,
    x: 12.18,
    y: 150.03,
    width: 200,
    height: 186,
  },
  {
    id: 8,
    x: 11.58,
    y: 336.33,
    width: 175,
    height: 111.8,
  },
  {
    id: 9,
    x: 11.34,
    y: 447.64,
    width: 175,
    height: 111.8,
  },
  {
    id: 10,
    x: 11.34,
    y: 559.64,
    width: 175,
    height: 111.8,
  },
  {
    id: 11,
    x: 11.34,
    y: 670.64,
    width: 175,
    height: 111.8,
  },
  {
    id: 12,
    x: 11.34,
    y: 782.64,
    width: 175,
    height: 111.8,
  },
];

export function getRelativeDimensions(
  realSvgWidth: number,
  realSvgHeight: number,
  scale: number,
  rooms: Room[]
) {
  const widthPercentage = realSvgWidth / svgWidth / scale;
  const heightPercentage = realSvgHeight / svgHeight / scale;
  console.log(widthPercentage, heightPercentage);

  return rooms.map((room) => {
    return {
      ...room,
      x: room.x * widthPercentage,
      y: room.y * heightPercentage,
      width: room.width * widthPercentage,
      height: room.height * heightPercentage,
    };
  });
}
