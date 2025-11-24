import { Button } from "@heroui/button";
import {
  ConnectModal,
  useCurrentAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { LogOut } from "lucide-react";
import { useState } from "react";

export const ConnectButtonCustom = () => {
  const currentAccount = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();

  const [open, setOpen] = useState(false);

  const shortAddress = (addr: string) =>
    addr.slice(0, 6) + "..." + addr.slice(-4);

  return (
    <div className="flex items-center">
      <ConnectModal open={open} trigger={<span />} onOpenChange={setOpen} />

      {!currentAccount && (
        <Button color="primary" variant="flat" onPress={() => setOpen(true)}>
          Connect Wallet
        </Button>
      )}

      {currentAccount && (
        <div className="flex items-center gap-1">
          <Button className="text-sm" color="primary" variant="flat">
            {shortAddress(currentAccount.address)}
          </Button>

          <Button
            isIconOnly
            color="danger"
            variant="flat"
            onPress={() => disconnect()}
          >
            <LogOut size={18} />
          </Button>
        </div>
      )}
    </div>
  );
};
