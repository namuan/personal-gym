import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { theme } from "../theme";

const subtitle =
  "Your personal exercise gym instructor — set by set, rep by rep.";

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Background gradient animation
  const bgOpacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Title animation: slide up + fade in
  const titleY = interpolate(frame, [10, 40], [60, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: (t) => 1 - Math.pow(1 - t, 3),
  });
  const titleOpacity = interpolate(frame, [10, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Subtitle animation
  const subtitleOpacity = interpolate(frame, [30, 55], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Decorative dots animation
  const dot1Scale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, mass: 0.5 },
  });
  const dot2Scale = spring({
    frame: frame - 15,
    fps,
    config: { damping: 12, mass: 0.5 },
  });
  const dot3Scale = spring({
    frame: frame - 25,
    fps,
    config: { damping: 12, mass: 0.5 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        opacity: bgOpacity,
      }}
    >
      {/* Background decorative elements */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${theme.brandFromRgb},0.15) 0%, transparent 70%)`,

        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: "5%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${theme.brandFromRgb},0.12) 0%, transparent 70%)`,
        }}
      />

      {/* Dumbbell icon (simple SVG) */}
      <div
        style={{
          position: "absolute",
          top: "22%",
          left: "50%",
          marginLeft: -30,
          opacity: titleOpacity,
        }}
      >
        <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
          <rect
            x="22"
            y="10"
            width="16"
            height="40"
            rx="3"
            fill={theme.brandFrom}
          />
          <rect x="8" y="16" width="10" height="28" rx="5" fill={theme.brandMid} />
          <rect
            x="42"
            y="16"
            width="10"
            height="28"
            rx="5"
            fill={theme.brandMid}
          />
        </svg>
      </div>

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: 0,
          right: 0,
          textAlign: "center",
          transform: `translateY(${titleY}px)`,
          opacity: titleOpacity,
        }}
      >
        <h1
          style={{
            fontSize: 96,
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: theme.textPrimary,
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          Personal{" "}
          <span
            style={{
              background: `linear-gradient(135deg, ${theme.brandFrom}, ${theme.brandTo})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Gym
          </span>
        </h1>
      </div>

      {/* Subtitle */}
      <div
        style={{
          position: "absolute",
          top: "56%",
          left: "50%",
          marginLeft: -360,
          width: 720,
          textAlign: "center",
          opacity: subtitleOpacity,
        }}
      >
        <p
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: theme.textMuted,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Decorative dots */}
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          left: "50%",
          marginLeft: -36,
          display: "flex",
          gap: 12,
          opacity: subtitleOpacity,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: theme.brandFrom,
            transform: `scale(${dot1Scale})`,
          }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: theme.brandMid,
            transform: `scale(${dot2Scale})`,
          }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: theme.brandTo,
            transform: `scale(${dot3Scale})`,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
