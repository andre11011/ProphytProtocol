export const formatDate = (dateString: string | undefined) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};
