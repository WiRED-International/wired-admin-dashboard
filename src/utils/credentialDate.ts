const CREDENTIAL_TIME_ZONE = "Africa/Nairobi";

export const formatCredentialDate = (
  value: string | null | undefined
): string => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    timeZone: CREDENTIAL_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};