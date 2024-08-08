"use client";

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

  // if (!publicKey) return;

  async function signandSend() {
    const message = new TextEncoder().encode(
      "Sign in with the mechanical turks",
    );
    const signature = await signMessage?.(message);
    const response = await axios.post(`${BACKEND_URL}/api/v1/worker/signin`, {
      signature,
      publicKey: publicKey?.toString(),
    });
    localStorage.setItem("token", response.data.token);
  }

  useEffect(() => {
    signandSend();
  }, [publicKey]);

  return (
    <div className="flex justify-between border-b pb-2 pt-2">
      <div className="text-xl pl-4 flex justify-center "> Turkify </div>
      <div className="text-xl pr-4 pb-2">
        {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
      </div>
    </div>
  );
}
