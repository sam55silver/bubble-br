export async function getTurnServers() {
  const response = await fetch(
    "https://samsilver.metered.live/api/v1/turn/credentials?apiKey=8653fb66a84ac3b8242adc8adc915bf05caf",
  );

  // Saving the response in the iceServers array
  const iceServers = await response.json();

  return iceServers;
}
