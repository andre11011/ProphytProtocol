'use client';

import { useState } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Spinner,
  Input,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
} from '@heroui/react';
import { ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import {
  useNautilusHealth,
  useMarketResolutions,
  useResolveMarket,
} from '@/hooks/queries/use-nautilus';
import { addToast } from '@heroui/react';
import type { Market } from '@/types/market.types';

interface NautilusVerificationProps {
  market: Market;
}

export function NautilusVerification({ market }: NautilusVerificationProps) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dataSourceUrl, setDataSourceUrl] = useState(market.externalLink || '');

  // Check Nautilus health
  const { data: healthData, isLoading: healthLoading } = useNautilusHealth();

  // Get resolutions for this market
  const { data: resolutionsData, isLoading: resolutionsLoading } = useMarketResolutions(
    market.marketId,
    { limit: 1 },
  );

  // Resolve market mutation
  const resolveMutation = useResolveMarket();

  const isHealthy = healthData?.healthy ?? false;
  const isEnabled = healthData?.enabled ?? false;
  const hasResolution = resolutionsData && resolutionsData.length > 0;
  const latestResolution = hasResolution ? resolutionsData[0] : null;

  const handleResolve = () => {
    resolveMutation.mutate(
      {
        marketId: market.marketId,
        options: {
          useNautilus: true,
          dataSourceUrl: dataSourceUrl || undefined,
        },
      },
      {
        onSuccess: () => {
          addToast({
            title: 'Success',
            description: 'Market resolution initiated with Nautilus',
            color: 'success',
          });
          onClose();
        },
        onError: (error: Error) => {
          addToast({
            title: 'Error',
            description: error.message || 'Failed to resolve market',
            color: 'danger',
          });
        },
      },
    );
  };

  if (!isEnabled) {
    return null; // Don't show if Nautilus is not enabled
  }

  return (
    <>
      <Card>
        <CardHeader className="flex items-center gap-2">
          <ShieldCheckIcon className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Nautilus Verification</h3>
          {healthLoading ? (
            <Spinner size="sm" className="ml-auto" />
          ) : (
            <Chip
              color={isHealthy ? 'success' : 'danger'}
              size="sm"
              variant="flat"
              className="ml-auto"
            >
              {isHealthy ? 'Online' : 'Offline'}
            </Chip>
          )}
        </CardHeader>
        <CardBody>
          <div className="space-y-4">
            {healthLoading ? (
              <div className="flex justify-center py-4">
                <Spinner size="sm" />
              </div>
            ) : (
              <>
                {!isHealthy && (
                  <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                      Nautilus server is offline. Market resolution may be delayed.
                    </div>
                  </div>
                )}

                {market.isResolved ? (
                  <div className="space-y-2">
                    {hasResolution ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Verification Status:</span>
                          <Chip color="success" size="sm" variant="flat">
                            Verified
                          </Chip>
                        </div>
                        {latestResolution && (
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                            <div>
                              <span className="font-medium">Outcome:</span>{' '}
                              {latestResolution.outcome ? 'YES' : 'NO'}
                            </div>
                            <div>
                              <span className="font-medium">Resolved:</span>{' '}
                              {new Date(latestResolution.created_at).toLocaleString()}
                            </div>
                            {latestResolution.source_data && (
                              <div className="truncate">
                                <span className="font-medium">Source:</span>{' '}
                                {latestResolution.source_data.substring(0, 50)}...
                              </div>
                            )}
                            <div className="font-mono text-xs break-all">
                              <span className="font-medium">Signature:</span>{' '}
                              {latestResolution.signature.substring(0, 32)}...
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        This market was resolved without Nautilus verification.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      This market will be automatically resolved using Nautilus Trust Oracle
                      when it ends. You can also manually trigger resolution.
                    </div>
                    {new Date(market.endDate) <= new Date() && (
                      <Button
                        color="primary"
                        variant="flat"
                        onPress={onOpen}
                        isLoading={resolveMutation.isPending}
                        className="w-full"
                      >
                        Resolve Market with Nautilus
                      </Button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CardBody>
      </Card>

      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>Resolve Market with Nautilus</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  This will trigger Nautilus Trust Oracle to verify and resolve the market
                  outcome. The resolution will be cryptographically signed and verified
                  on-chain.
                </p>
              </div>
              <Input
                label="Data Source URL (Optional)"
                placeholder="https://api.example.com/data"
                value={dataSourceUrl}
                onChange={(e) => setDataSourceUrl(e.target.value)}
                description="External API endpoint to verify the market outcome"
              />
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Market:</strong> {market.question}
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleResolve}
              isLoading={resolveMutation.isPending}
            >
              Resolve Market
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}

