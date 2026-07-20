import Auth from "@/utils/auth";
import { apiPrefix } from "@/utils/globalVariables";
import { TranscriptRecordInterface } from "@/interfaces/UserDataInterface";

export async function fetchTranscript(
  userId: number
): Promise<TranscriptRecordInterface[]> {

  const response = await fetch(
    `${apiPrefix}/users/${userId}/transcript`,
    {
      headers: {
        Authorization: `Bearer ${Auth.getToken()}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch transcript.");
  }

  const data = await response.json();

  return data.transcript;
}