"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import axios from "axios";
import React, { useEffect } from "react";
import { Backed_URL } from "../uitls";

export default function Appbar() {
  const { publicKey, signMessage } = useWallet();

  async function signandSend() {
    const message = new TextEncoder().encode(
      "Sign in with the mechanical turks",
    );
    const signature = await signMessage?.(message);
    const response = await axios.post(`${Backed_URL}/api/v1/user/signin`, {
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
      <div className="text-red-500">Don't transfer the real crypto</div>
      <div className="text-xl pr-4 pb-2">
        {publicKey ? <WalletDisconnectButton /> : <WalletMultiButton />}
      </div>
    </div>
  );
}
