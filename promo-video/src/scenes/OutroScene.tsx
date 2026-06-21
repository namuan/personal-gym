import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";
import { theme } from "../theme";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, mass: 0.6 },
  });

  const ctaOpacity = interpolate(frame, [20, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const tagOpacity = interpolate(frame, [50, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: theme.bg,
        opacity,
      }}
    >
      {/* Background gradiant ring */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          marginTop: -300,
          marginLeft: -300,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${theme.brandFromRgb},0.18) 0%, transparent 70%)`,
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px",
        }}
      >
        {/* Dumbbell icon */}
        <div
          style={{
            marginBottom: 32,
            opacity,
            transform: `scale(${titleScale})`,
          }}
        >
          <svg width="48" height="48" viewBox="0 0 60 60" fill="none">
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

        <h2
          style={{
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: theme.textPrimary,
            textAlign: "center",
            lineHeight: 1.2,
            transform: `scale(${titleScale})`,
          }}
        >
          Start your fitness{" "}
          <span
            style={{
              background: `linear-gradient(135deg, ${theme.brandFrom}, ${theme.brandTo})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            journey
          </span>{" "}
          today
        </h2>

        <div
          style={{
            opacity: ctaOpacity,
            marginTop: 40,
          }}
        >
          <div
            style={{
              padding: "16px 48px",
              borderRadius: 12,
              background:
                `linear-gradient(135deg, ${theme.brandMid}, ${theme.brandTo})`,
              boxShadow: `0 8px 32px rgba(${theme.brandToRgb},0.35)`,
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: theme.bg,
              }}
            >
              Try it free — no account needed
            </span>
          </div>
        </div>

        <div
          style={{
            opacity: tagOpacity,
            marginTop: 48,
          }}
        >
          <p
            style={{
              fontSize: 18,
              fontWeight: 400,
              color: theme.textSubtle,
            }}
          >
            Install on your phone · Works offline · 100% free
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
