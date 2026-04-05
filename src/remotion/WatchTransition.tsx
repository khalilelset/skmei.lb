import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const WatchTransition = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  // Progress 0 → 1 over the full video with smooth ease in-out
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });

  // state1 fades out, state2 fades in + subtle zoom-out from 1.06 → 1
  const state1Opacity = interpolate(progress, [0, 1], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const state2Opacity = interpolate(progress, [0, 1], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const state2Scale = interpolate(progress, [0, 1], [1.06, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: "#0a0a0a" }}>
      {/* State 1 — assembled watch */}
      <AbsoluteFill style={{ opacity: state1Opacity }}>
        <Img
          src={staticFile("images/image-hero-section/state1.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      {/* State 2 — exploded components view */}
      <AbsoluteFill
        style={{
          opacity: state2Opacity,
          transform: `scale(${state2Scale})`,
        }}
      >
        <Img
          src={staticFile("images/image-hero-section/state2.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
