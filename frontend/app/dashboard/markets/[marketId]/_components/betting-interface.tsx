"use client";

import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  RadioGroup,
  Radio,
  Divider,
  Alert,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from "@heroui/react";
import {
  InformationCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

import { Market } from "@/types/market.types";
import { marketUtils } from "@/lib/api/markets";

interface BettingInterfaceProps {
  market: Market;
  onBetPlaced?: () => void;
}

export function BettingInterface({
  market,
  onBetPlaced,
}: BettingInterfaceProps) {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [position, setPosition] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isActive = !market.isResolved;
  const probability = market.probability || 50;

  const betAmount = parseFloat(amount) || 0;
  const totalYesBets = parseFloat(market.totalYesBets);
  const totalNoBets = parseFloat(market.totalNoBets);
  const totalPool = totalYesBets + totalNoBets;

  const calculatePayout = () => {
    if (betAmount <= 0) return 0;

    if (position === "yes") {
      if (totalYesBets === 0) return betAmount * 2;

      return (betAmount * totalPool) / (totalYesBets + betAmount);
    } else {
      if (totalNoBets === 0) return betAmount * 2;

      return (betAmount * totalPool) / (totalNoBets + betAmount);
    }
  };

  const potentialPayout = calculatePayout();
  const potentialProfit = potentialPayout - betAmount;

  const handleBetSubmit = async () => {
    if (!isActive) {
      setError("This market is no longer active");

      return;
    }

    if (betAmount <= 0) {
      setError("Please enter a valid bet amount");

      return;
    }

    setLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      onOpen();
      onBetPlaced?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to place bet";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAmount("");
    setError(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center w-full">
            <h3 className="text-lg font-semibold">Place Your Bet</h3>
            {!isActive && (
              <Chip color="warning" size="sm" variant="flat">
                Betting Closed
              </Chip>
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {!isActive ? (
            <Alert
              color="warning"
              startContent={<ExclamationTriangleIcon className="w-4 h-4" />}
              variant="flat"
            >
              {market.isResolved
                ? "This market has been resolved"
                : "This market has ended"}
            </Alert>
          ) : (
            <>
              <div>
                <label
                  className="block text-sm font-medium mb-2"
                  htmlFor="position-radio-group"
                >
                  Choose Position
                </label>
                <RadioGroup
                  className="gap-4"
                  id="position-radio-group"
                  orientation="horizontal"
                  value={position}
                  onValueChange={(value) => setPosition(value as "yes" | "no")}
                >
                  <Radio color="success" value="yes">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Yes</span>
                      <span className="text-sm text-gray-500">
                        ({Math.round(probability)}%)
                      </span>
                    </div>
                  </Radio>
                  <Radio color="danger" value="no">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">No</span>
                      <span className="text-sm text-gray-500">
                        ({Math.round(100 - probability)}%)
                      </span>
                    </div>
                  </Radio>
                </RadioGroup>
              </div>

              <Divider />

              <div>
                <Input
                  errorMessage={error}
                  isInvalid={!!error}
                  label="Bet Amount"
                  placeholder="0.00"
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">SUI</span>
                    </div>
                  }
                  type="number"
                  value={amount}
                  onValueChange={setAmount}
                />
              </div>

              {betAmount > 0 && (
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Bet Amount:</span>
                    <span className="font-mono">
                      {betAmount.toFixed(2)} SUI
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Potential Payout:</span>
                    <span className="font-mono font-medium text-green-600">
                      {potentialPayout.toFixed(2)} SUI
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Potential Profit:</span>
                    <span
                      className={`font-mono font-medium ${
                        potentialProfit > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {potentialProfit > 0 ? "+" : ""}
                      {potentialProfit.toFixed(2)} SUI
                    </span>
                  </div>
                </div>
              )}

              <Alert
                color="primary"
                startContent={<InformationCircleIcon className="w-4 h-4" />}
                variant="flat"
              >
                Prediction markets involve risk. Only bet what you can afford to
                lose.
              </Alert>

              <Button
                className="w-full"
                color="primary"
                isDisabled={!betAmount || betAmount <= 0}
                isLoading={loading}
                size="lg"
                onClick={handleBetSubmit}
              >
                {loading
                  ? "Placing Bet..."
                  : `Bet ${betAmount || "0"} SUI on ${position.toUpperCase()}`}
              </Button>

              <div className="flex gap-2">
                <Button size="sm" variant="flat" onClick={() => setAmount("1")}>
                  1 SUI
                </Button>
                <Button size="sm" variant="flat" onClick={() => setAmount("5")}>
                  5 SUI
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onClick={() => setAmount("10")}
                >
                  10 SUI
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onClick={() => setAmount("50")}
                >
                  50 SUI
                </Button>
              </div>
            </>
          )}

          <Divider />
          <div>
            <h4 className="font-medium mb-2">Current Market State</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Yes Probability:</span>
                <span className="font-medium text-green-600">
                  {Math.round(probability)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">No Probability:</span>
                <span className="font-medium text-red-600">
                  {Math.round(100 - probability)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Pool:</span>
                <span className="font-mono">
                  {marketUtils.formatVolume(market.totalPoolSize)}
                </span>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3>Bet Placed Successfully!</h3>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-3">
                  <p>Your bet has been placed on the blockchain.</p>
                  <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Position:</span>
                      <span
                        className={`font-medium ${position === "yes" ? "text-green-600" : "text-red-600"}`}
                      >
                        {position.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-mono">{betAmount} SUI</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    You can view your bet history and claim winnings from your
                    account page.
                  </p>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  color="primary"
                  onPress={() => {
                    onClose();
                    resetForm();
                  }}
                >
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}
