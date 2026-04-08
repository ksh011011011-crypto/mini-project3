type Portal = "mall" | "cinema" | "concert";

/**
 * 탭·빠른 이동·주차 화면 전환마다 짧은 풀스크린 연출(포인터 통과).
 * `burstKey`가 바뀔 때마다 variant 순환.
 */
export default function PortalScreenFx({
  burstKey,
  portal,
}: {
  burstKey: number;
  portal: Portal;
}) {
  if (burstKey < 1) return null;
  const v = burstKey % 8;
  return (
    <div
      key={burstKey}
      className={`sehyeon-portal-burst sehyeon-portal-burst--v${v} sehyeon-portal-burst--p-${portal}`}
      aria-hidden
    />
  );
}
