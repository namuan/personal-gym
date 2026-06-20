import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from "remotion";

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
        backgroundColor: "#0f172a",
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
          background:
            "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)",
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
              fill="#6366f1"
            />
            <rect x="8" y="16" width="10" height="28" rx="5" fill="#818cf8" />
            <rect
              x="42"
              y="16"
              width="10"
              height="28"
              rx="5"
              fill="#818cf8"
            />
          </svg>
        </div>

        <h2
          style={{
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "#f8fafc",
            textAlign: "center",
            lineHeight: 1.2,
            transform: `scale(${titleScale})`,
          }}
        >
          Start your fitness{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #6366f1, #a78bfa)",
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
                "linear-gradient(135deg, #6366f1, #818cf8)",
              boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
            }}
          >
            <span
              style={{
                fontSize: 24,
                fontWeight: 600,
                color: "#ffffff",
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
              color: "#64748b",
            }}
          >
            Install on your phone · Works offline · 100% free
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
