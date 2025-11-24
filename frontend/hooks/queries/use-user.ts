import { useQuery } from "@tanstack/react-query";

import { userService } from "@/services/user.service";

export const useUserBets = (
  address: string,
  params?: { limit?: number; offset?: number },
  enabled = true,
) => {
  return useQuery({
    queryKey: ["user", address, "bets", params],
    queryFn: () => userService.getUserBets(address, params),
    enabled: enabled && !!address,
  });
};
