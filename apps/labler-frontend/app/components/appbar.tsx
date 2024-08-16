"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import React, { useEffect } from "react";
import { BACKEND_URL } from "../utils/index";

export default function Appbar() {
  const { publicKey, signMessage } = useWallet();
  const [balance, setBalance] = useState(0);

  async function signandSend() {
    const message = new TextEncoder().encode(
      "Sign in with the mechanical turks",
    );
    const signature = await signMessage?.(message);
    const response = await axios.post(`${BACKEND_URL}/api/v1/worker/signin`, {
      signature,
      publicKey: publicKey?.toString(),
    });
    setBalance(response.data.amount);
    localStorage.setItem("token", response.data.token);
  }

  useEffect(() => {
    signandSend();
  }, [publicKey]);

  return (
    <div className="flex justify-between border-b pb-2 pt-2">
      <div className="text-2xl pl-4 flex justify-center pt-2">Turkify</div>
      <div className="text-red-500">
        Site in development No Real Crypto will be given
      </div>
      <div className="text-xl pr-4 flex">
        <button
          onClick={() => {
            axios.post(
              `${BACKEND_URL}/api/v1/worker/payout`,
              {},
              {
                headers: {
                  Authorization: localStorage.getItem("token"),
                },
              },
            );
          }}
          className="m-2 mr-4 text-white bg-gray-800 hover:bg-gray-900 focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium rounded-full text-sm px-5 py-2.5 me-2 dark:bg-gray-800 dark:hover:bg-gray-700 dark:focus:ring-gray-700 dark:border-gray-700"
        >
          Pay me out ({balance}) SOL
        </button>
        {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
      </div>
    </div>
  );
}
