import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const HelloWorld = ({ title }: { title: string }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame, fps, config: { damping: 200 } });
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0b0f", justifyContent: "center", alignItems: "center" }}>
      <h1 style={{ color: "white", fontSize: 140, fontFamily: "sans-serif", opacity, transform: `scale(${scale})` }}>
        {title}
      </h1>
    </AbsoluteFill>
  );
};
