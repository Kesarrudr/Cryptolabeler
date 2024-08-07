import React from "react";

export default function Appbar() {
  return (
    <div className="flex justify-between border-b pb-2 pt-2">
      <div className="text-xl pl-4 flex justify-center "> Turkify </div>
      <div className="text-xl pr-4 pb-2"> Connect to wallet</div>
    </div>
  );
}
