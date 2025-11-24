import { getFullnodeUrl } from "@mysten/sui/client";
import { createNetworkConfig } from "@mysten/dapp-kit";

import { PROPHYT_PACKAGE_ID } from "./contracts";

const { networkConfig, useNetworkVariable, useNetworkVariables } =
  createNetworkConfig({
    testnet: {
      url: getFullnodeUrl("testnet"),
      variables: {
        prophytPackageId: PROPHYT_PACKAGE_ID,
        gqlClient: "https://sui-testnet.mystenlabs.com/graphql",
      },
    },
  });

export { useNetworkVariable, useNetworkVariables, networkConfig };
